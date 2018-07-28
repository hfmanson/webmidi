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

// https://elgervanboxtel.nl/site/blog/xmlhttprequest-extended-with-promises
const Request = (() => {
    const
        get = function(url) {
            return request('GET', url);
        }, post = function(url){
            return request('POST', url);
        }, request = function(method, url) {
            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open(method, url);
                xhr.onload = function(e){
                    if (xhr.status === 200) {
                        resolve(xhr);
                    } else {
                        reject(Error('XMLHttpRequest failed; error code:' + xhr.statusText));
                    }
                },
                xhr.onerror = reject;
                xhr.send();
            });
        }
        ;

    return {
        get: get,
        post: post,
        request: request
    }
})();

export default function createCoilsynth() {
    const
        handleNote = (command, note, velocity) => {
            console.log("handleNote, command: " + command + ", note: " + note);
            if (note) {
                Request.get("../midi?command=" + command + "&note=" + note + "&velocity=" + velocity).catch(function(e) { // catch all XHR errors
                    console.error('Network error while fetching');
                }).then(function (e) {
                    return e.response;
                }).then(function (responseXML) {
                    //console.log(responseXML);
                }).catch(function(e) { // catch all other errors
                    console.dir(e);
                    console.log(e.message, "readystate:", e);
                    // throw an error
                    throw new Error("throw error");
                });
            }
        }, send = (event) => {
            const data = event.data ? event.data : event.detail;
            // Mask off the lower nibble (MIDI channel, which we don't care about)
            switch (data[0] & 0xf0) {
                case 0x90:
                    if (data[2] !== 0) {  // if velocity != 0, this is a note-on message
                        handleNote("note_on", data[1], 0x7f);
                        return;
                    }
                    // if velocity == 0, fall thru: it's a note-off.  MIDI's weird, ya'll.
                case 0x80:
                    handleNote("note_off", data[1], 0x00);
                    return;
            }
        }
    ;
    
    return {
        send: send
    };
}

