import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { ChimeAccessory } from './chimeAccessory';

import request from 'request';
import util from 'util';
const requestPromise = util.promisify(request);

export class HomebridgeUnifiProtectChimes implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  private csrfToken = '';
  private cookie = '';
  private invalidCredentials = false;
  private loginAttempts = 0;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config);
    this.api.on('didFinishLaunching', () => {
      this.discoverDevices();
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  async login() {
    if (this.invalidCredentials) {
      return false;
    }
    if (this.csrfToken && this.cookie) {
      return true;
    }
    this.loginAttempts++;
    const json = { username: this.config.username, password: this.config.password };
    const response = await requestPromise({ uri: `${this.config.nvrAddress}/api/auth/login`, method: 'POST', json: json,
      rejectUnauthorized: false, requestCert: false, resolveWithFullResponse: true });

    this.log.debug('login response: ', response.statusCode);
    if(response.statusCode == 200) {
      this.csrfToken = response.headers['x-csrf-token'];
      this.cookie = response.headers['set-cookie'];
    } else {
      this.log.error('Authorization failed', response.statusCode);
      this.invalidCredentials = true;
    }
  }

  timeout(ms) {
    return new Promise( resolve => setTimeout(resolve, ms));
  }

  async sleep(fn, ...args) {
    await this.timeout(5000);
    return fn(...args);
  }

  async clearAuthenticationAndSleepAfterTooManyAttempts() {
    this.cookie = '';
    this.csrfToken = '';
    if(this.loginAttempts > 5) {
      this.log.info('Login attempt surpassing 5, sleeping for 5 seconds..');
      await this.sleep(() => {
        this.log.debug('sleeping...');
      });
    }
  }

  async chimes() {
    await this.login();

    const response = await requestPromise({ uri: `${this.config.nvrAddress}/proxy/protect/api/chimes`, method: 'GET',
      headers: { 'cookie': this.cookie, 'x-csrf-token': this.csrfToken },
      rejectUnauthorized: false, requestCert: false, resolveWithFullResponse: true });

    if (response.statusCode != 200) {
      this.log.error('Chimes unexpected response: ', response.statusCode);
      await this.clearAuthenticationAndSleepAfterTooManyAttempts();
      return await this.chimes();
    }

    const json = JSON.parse(response.body);
    this.log.info(`Chimes got: ${json.length}`, json.map((chime) => {
      return chime.id;
    }));
    return json;
  }

  async chimeSetVolume(id: string, value: number) {
    await this.login();

    const json = { volume: value };
    const response = await requestPromise({ uri: `${this.config.nvrAddress}/proxy/protect/api/chimes/${id}`, method: 'PATCH',
      headers: { 'cookie': this.cookie, 'x-csrf-token': this.csrfToken }, json: json,
      rejectUnauthorized: false, requestCert: false, resolveWithFullResponse: true });

    if (response.statusCode != 200) {
      this.log.error('Chime Set Volume unexpected response: ', response.statusCode);
      await this.clearAuthenticationAndSleepAfterTooManyAttempts();
      return await this.chimeSetVolume(id, value);
    }

    this.log.info('Chime Set Volume responded: ', id, response.body.volume as number);
  }

  async chimeGetVolume(id: string) {
    await this.login();

    const response = await requestPromise({ uri: `${this.config.nvrAddress}/proxy/protect/api/chimes/${id}`, method: 'GET',
      headers: { 'cookie': this.cookie, 'x-csrf-token': this.csrfToken },
      rejectUnauthorized: false, requestCert: false, resolveWithFullResponse: true });

    if (response.statusCode != 200) {
      this.log.error('Chime Set Volume unexpected response: ', response.statusCode);
      await this.clearAuthenticationAndSleepAfterTooManyAttempts();
      return await this.chimeGetVolume(id);
    }

    const json = JSON.parse(response.body);
    this.log.info('Chime Get Volume: ', id, json.volume);
    return json.volume as number;
  }

  async discoverDevices() {
    const chimes = await this.chimes();
    for( const chime of chimes) {
      const uuid = this.api.hap.uuid.generate('chime_' + chime.id);
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
      if (existingAccessory) {
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
        this.api.updatePlatformAccessories([existingAccessory]);
        new ChimeAccessory(this, existingAccessory);
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        // this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
      } else {
        this.log.info('Adding new accessory:', chime.name);
        const accessory = new this.api.platformAccessory(chime.name, uuid);
        accessory.context.device = chime;
        new ChimeAccessory(this, accessory);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }
}
