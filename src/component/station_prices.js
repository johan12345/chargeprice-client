require('jsrender')($);

import ProviderFeaturing from './providerFeaturing';
import ViewBase from './viewBase';
import StartTimeSelection from '../modal/startTimeSelection';
import {html, render} from 'lit-html';
import RepositoryStartTime from '../repository/settings/startTime';

export default class StationPrices extends ViewBase{
  constructor(sidebar,analytics, translation) {
    super(translation)
    this.sidebar = sidebar;
    this.analytics = analytics;
    this.slider = null;
    this.defaultBatteryRange = [20,80];
    this.startTimeRepo = new RepositoryStartTime();
    this.initSlider();
  }

  batteryRangeInfoTempl(obj){
    return this.sf(this.t("batteryRangeInfo"),obj.from,obj.to);
  }

  parameterNoteTempl(obj){
    return html`
      <span class="w3-left">
        <i class="fa fa-clock-o"></i> 
          <span class="link-text" @click="${()=>this.selectStartTime()}">${this.h().timeOfDay(this.getStartTime())}</span> 
          <i class="fa fa-angle-right"></i> ~${this.h().timeOfDay(this.getEndTime(obj.chargePointDuration))}
          <br>
        (${this.h().time(obj.chargePointDuration)})
        
      </span>
      <span class="w3-right">
        <i class="fa fa-bolt"></i>
        ${this.h().int(obj.chargePointEnergy)} kWh 
        (${this.t("average")} ${this.h().power(obj.chargePointEnergy*60/obj.chargePointDuration)} kW)
      </span>
    `;
  }

  chargePointTempl(list){
    return list.map(obj=>html`
      <option value="${obj.id}" ?disabled="${!obj.supportedByVehicle}">${this.h().upper(obj.plug)} ${obj.power} kw (${obj.count}x)</option>
    `);
  }

  initSlider(){
    this.slider = document.getElementById('batteryRange');

    noUiSlider.create(this.slider, {
        start: this.getStoredOrDefaultBatteryRange(),
        step: 1,
        connect: true,
        range: { min: 0,max: 100 }
    });

    this.updateBatteryRangeInfo();
    this.slider.noUiSlider.on('update', ()=>this.updateBatteryRangeInfo());
    this.slider.noUiSlider.on('end', ()=>{
      this.storeBatteryRange();
      const range = this.getBatteryRange();
      const totalPercentage = range[1]-range[0]; 
      this.analytics.log('send', 'event', 'BatteryChanged', totalPercentage,null,range[0]);
      this.batteryChangedCallback()
    });
  }

  getBatteryRange(){
    return this.slider.noUiSlider.get().map(v=>parseInt(v));
  }

  updateBatteryRangeInfo(){
    const range = this.getBatteryRange();
    render(this.batteryRangeInfoTempl({from: range[0], to: range[1]}),this.getEl("batteryRangeInfo"));
  }

  showStation(station,options){
    const sortedCP = station.chargePoints.sort((a,b)=>{
      const b1 = b.supportedByVehicle;
      const a1 = a.supportedByVehicle;

      if(b1 == a1) return (b.power-a.power);
      else return b1 - a1;
    });
    render(this.chargePointTempl(sortedCP),this.getEl("select-charge-point"));
  }
 
  updateStationPrice(station,prices,options){
    const sortedPrices = prices.sort((a,b)=>a.price - b.price);
    this.addFeaturings(sortedPrices);

    $("#priceList").html($.templates("#priceTempl").render(sortedPrices));
    $("#station-info").html($.templates("#stationTempl").render(station));
    $("#prices").toggle(!station.isFreeCharging && prices.length > 0 || prices.length > 0);
    $("#noPricesAvailable").toggle(!station.isFreeCharging && prices.length == 0);
    render(this.parameterNoteTempl(options),this.getEl("parameterNote"));
    
    $(".affiliateLinkEMP").click((linkObject)=> this.analytics.log('send', 'event', 'AffiliateEMP', linkObject.currentTarget.href));
  }

  addFeaturings(prices){
    const featurings = new ProviderFeaturing().getFeaturedProviders();
    prices.forEach(p=>p.featuring = featurings[p.tariff.provider]);
  }

  onBatteryRangeChanged(callback){
    this.batteryChangedCallback = callback;
  }

  storeBatteryRange(){
    localStorage.setItem("batteryRange",JSON.stringify(this.getBatteryRange()));
  }

  getStoredOrDefaultBatteryRange(){
    if(localStorage.getItem("batteryRange")){
      return JSON.parse(localStorage.getItem("batteryRange"));
    }
    else return this.defaultBatteryRange;
  }

  onStartTimeChanged(callback){
    this.startTimeChangedCallback = callback;
  }

  getStartTime(){
    const storedStartTime = this.startTimeRepo.get();
    if(storedStartTime != null) return storedStartTime;
    const time = new Date();
    return time.getHours()*60+time.getMinutes();
  }

  getEndTime(duration){
    return (this.getStartTime() + duration) % 1440;
  }

  selectStartTime(){
    new StartTimeSelection(this.translation).show(this.startTimeRepo.get(), (result)=>{
      this.startTimeRepo.set(result);
      if(this.startTimeChangedCallback) this.startTimeChangedCallback();
      const hourTime = result == null ? "now" : (result/60).toFixed(0);
      this.analytics.log('send', 'event', 'StartTimeChanged', hourTime);
    })
  }

}