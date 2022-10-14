import { access } from 'fs';
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HomebridgeUnifiProtectChimes } from './platform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ChimeAccessory {
  private service: Service;
  private lastKnownVolume: number = 0;

  constructor(
    private readonly platform: HomebridgeUnifiProtectChimes,
    private readonly accessory: PlatformAccessory
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Unifi')
      .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.type)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.id);
    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))                // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this));               // GET - bind to the `getOn` method below
    // register handlers for the Brightness Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this))       // SET - bind to the 'setBrightness` method below
      .onGet(this.getBrightness.bind(this));
  }

  async setOn(value: CharacteristicValue) {
    const newValue = value ? this.lastKnownVolume : 0;
    this.platform.chimeSetVolume(this.accessory.context.device.id, newValue);
  }

  async getOn(): Promise<CharacteristicValue> {
    const currentVolumeApi = await this.platform.chimeGetVolume(this.accessory.context.device.id);
    this.lastKnownVolume = currentVolumeApi as number;
    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    return currentVolumeApi > 0;
  }

  async setBrightness(value: CharacteristicValue) {
    this.platform.chimeSetVolume(this.accessory.context.device.id, value);
    // force update on the current state
    this.service.getCharacteristic(this.platform.Characteristic.Brightness).updateValue(value);
    this.lastKnownVolume = value as number;
  }

  async getBrightness(): Promise<CharacteristicValue> {
    const currentVolumeApi = await this.platform.chimeGetVolume(this.accessory.context.device.id);
    this.lastKnownVolume = currentVolumeApi as number;
    // force update on the current state
    this.service.getCharacteristic(this.platform.Characteristic.Brightness).updateValue(currentVolumeApi);
    this.service.getCharacteristic(this.platform.Characteristic.On).updateValue(currentVolumeApi > 0);
    return currentVolumeApi;
  }
}
