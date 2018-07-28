/* Copyright 2013 Chris Wilson

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
export default function createMonosynth() {
    const
        attack = 0.05			// attack speed
        , release = 0.05		// release speed
        , portamento = 0.05	// portamento/glide speed
        , activeNotes = []	// the stack of actively-pressed keys
        , AudioContext = window.AudioContext || window.webkitAudioContext
        , context = new AudioContext()
        , oscillator = context.createOscillator()
        , envelope = context.createGain()
        , frequencyFromNoteNumber = (note) => {
            return 440 * Math.pow(2, (note - 69) / 12);
        }, noteOn = (noteNumber) => {
            activeNotes.push( noteNumber );
            oscillator.frequency.cancelScheduledValues(0);
            oscillator.frequency.setTargetAtTime(frequencyFromNoteNumber(noteNumber), 0, portamento);
            envelope.gain.cancelScheduledValues(0);
            envelope.gain.setTargetAtTime(1.0, 0, attack);
        }, noteOff = (noteNumber) => {
            var position = activeNotes.indexOf(noteNumber);
            if (position !== -1) {
                activeNotes.splice(position, 1);
            }
            if (activeNotes.length === 0) {	// shut off the envelope
                envelope.gain.cancelScheduledValues(0);
                envelope.gain.setTargetAtTime(0.0, 0, release);
            } else {
                oscillator.frequency.cancelScheduledValues(0);
                oscillator.frequency.setTargetAtTime(frequencyFromNoteNumber(activeNotes[activeNotes.length - 1]), 0, portamento);
            }
        }, send = (event) => {
            const data = event.data ? event.data : event.detail;
            // Mask off the lower nibble (MIDI channel, which we don't care about)
            switch (data[0] & 0xf0) {
                case 0x90:
                    if (data[2] !== 0) {  // if velocity != 0, this is a note-on message
                        noteOn(data[1]);
                        return;
                    }
                    // if velocity == 0, fall thru: it's a note-off.  MIDI's weird, ya'll.
                case 0x80:
                    noteOff(data[1]);
                    return;
            }
        }
    ;
    
    // set up the basic oscillator chain, muted to begin with.
    oscillator.frequency.setValueAtTime(110, 0);
    oscillator.connect(envelope);
    envelope.connect(context.destination);
    envelope.gain.value = 0.0;  // Mute the sound
    oscillator.start(0);  // Go ahead and start up the oscillator
    return {
        send: send
    };
}

