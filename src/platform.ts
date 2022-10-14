import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { ChimeAccessory } from './chimeAccessory';

const request = require('request');
const util = require('util');
const requestPromise = util.promisify(request);

 export class HomebridgeUnifiProtectChimes implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  private csrfToken: string = '';
  private cookie: string = '';

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
    if (this.csrfToken && this.cookie) {
      return true;
    }
    const json = { username: this.config.username, password: this.config.password };
    const response = await requestPromise({ uri: `${this.config.nvrAddress}/api/auth/login`, method: 'POST', json: json,
      rejectUnauthorized: false, requestCert: false, resolveWithFullResponse: true });

    // TODO: add error handling
    this.csrfToken = response.headers['x-csrf-token'];
    this.cookie = response.headers['set-cookie'];
  }

  async chimes() {
    await this.login();
    const response = await requestPromise({ uri: `${this.config.nvrAddress}/proxy/protect/api/chimes`, method: 'GET',
      headers: { 'cookie': this.cookie, 'x-csrf-token': this.csrfToken },
      rejectUnauthorized: false, requestCert: false, resolveWithFullResponse: true });

    // TODO: error handling

    this.log.debug('chimes response', response.body);
    this.log.debug('chimes response', JSON.parse(response.body));
    return JSON.parse(response.body);
  }

  async chimeSetVolume(id, value) {
    await this.login();
    const json = { volume: parseInt(value) };
    const response = await requestPromise({ uri: `${this.config.nvrAddress}/proxy/protect/api/chimes/${id}`, method: 'PATCH',
      headers: { 'cookie': this.cookie, 'x-csrf-token': this.csrfToken }, json: json,
      rejectUnauthorized: false, requestCert: false, resolveWithFullResponse: true });
    // TODO: error handling
  }

  async chimeGetVolume(id) {
    await this.login();

    const response = await requestPromise({ uri: `${this.config.nvrAddress}/proxy/protect/api/chimes/${id}`, method: 'GET',
      headers: { 'cookie': this.cookie, 'x-csrf-token': this.csrfToken },
      rejectUnauthorized: false, requestCert: false, resolveWithFullResponse: true });

    // TODO: error handling
    return parseInt(JSON.parse(response.body).volume);
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
