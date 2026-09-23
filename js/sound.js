(function(){
  'use strict';
  let ctx=null,musicTimer=null,noteIndex=0;
  const tones={click:[420,.035],correct:[660,.1],wrong:[190,.12],complete:[520,.12]};
  const melody=[261.63,329.63,392,329.63,293.66,349.23,440,349.23,261.63,329.63,392,523.25,440,392,329.63,0];
  function audioContext(){ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume().catch(()=>{});return ctx}
  function note(frequency,duration=.42,volume=.012,type='triangle'){
    if(!frequency)return;
    const audio=audioContext(),oscillator=audio.createOscillator(),gain=audio.createGain();
    oscillator.type=type;oscillator.frequency.value=frequency;
    gain.gain.setValueAtTime(.001,audio.currentTime);
    gain.gain.linearRampToValueAtTime(volume,audio.currentTime+.035);
    gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
    oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+duration+.02);
  }
  window.Sound={
    enabled:window.Store.sound(),
    toggle(){this.enabled=!this.enabled;window.Store.setSound(this.enabled);if(this.enabled)this.startMusic();else this.stopMusic();return this.enabled},
    startMusic(){
      if(!this.enabled||musicTimer||document.hidden)return;
      try{audioContext();const playNext=()=>{if(!this.enabled)return;note(melody[noteIndex%melody.length]);noteIndex++};playNext();musicTimer=setInterval(playNext,620)}catch(_){}
    },
    stopMusic(){clearInterval(musicTimer);musicTimer=null},
    play(type){
      if(!this.enabled)return;
      try{const [freq,dur]=tones[type]||tones.click;note(freq,dur,.045,'sine');if(type==='complete')setTimeout(()=>this.play('correct'),130)}catch(_){}
    }
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden)window.Sound.stopMusic()});
}());
