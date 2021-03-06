
import Translation from '../component/translation.js';
import CustomConfig from '../component/customConfig';
import Analytics from '../component/analytics'
import RepositorySettingsPrimitive from '../repository/settings/primitive'

export default class Dependencies {

  constructor(){
    this.translationInstance = new Translation();
    this.customConfigInstance = new CustomConfig();
  }

  settingsPrimitive(...args){
    return new RepositorySettingsPrimitive(this,...args);
  }

  analytics(){
    return new Analytics();
  }

  translation(){
    return this.translationInstance;
  }

  customConfig(){
    return this.customConfigInstance;
  }
}


