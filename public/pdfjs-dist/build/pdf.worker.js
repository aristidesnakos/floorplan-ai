/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// This is a simplified version of the PDF.js worker for localhost MVP
// It implements the minimum functionality needed to make PDF.js work

(function () {
  "use strict";

  // The workerVersion should match the version used in your react-pdf
  const workerVersion = "3.4.120";

  // Set up the worker global
  if (typeof globalThis.pdfjsWorker === "undefined") {
    globalThis.pdfjsWorker = {};
  }

  // Fake worker implementation
  class FakeWorkerTransport {
    constructor() {
      this.id = "fake_" + Date.now().toString();
      this._callbacks = new Map();
      this._messageHandlers = new Map();
      this._terminated = false;
      this._version = workerVersion;
    }

    postMessage(obj) {
      if (this._terminated) {
        return;
      }

      // Handle messages from the main thread
      if (obj.action === "test") {
        // Test message - respond with version
        this._sendMessageToMain({
          action: "test",
          result: true,
          version: this._version
        });
      } else if (obj.action === "getDocument") {
        // Simulate document loading
        setTimeout(() => {
          this._sendMessageToMain({
            action: "getDocument",
            result: {
              numPages: 1,
              fingerprint: "fake_fingerprint"
            }
          });
        }, 100);
      } else if (obj.action === "getPage") {
        // Simulate page loading
        setTimeout(() => {
          this._sendMessageToMain({
            action: "getPage",
            result: {
              pageIndex: obj.pageIndex,
              width: 595,
              height: 842
            }
          });
        }, 50);
      } else {
        // Default response for other actions
        this._sendMessageToMain({
          action: obj.action,
          result: {}
        });
      }
    }

    _sendMessageToMain(message) {
      if (this._terminated) {
        return;
      }

      // Simulate message from worker to main thread
      setTimeout(() => {
        if (typeof globalThis.postMessage !== "undefined") {
          globalThis.postMessage({
            targetName: "main",
            data: message,
            workerId: this.id
          });
        }
      }, 0);
    }

    terminate() {
      this._terminated = true;
    }
  }

  // Register as a PDF.js worker
  globalThis.pdfjsWorker.WorkerTransport = FakeWorkerTransport;
  
  // Respond to messages from the main thread
  globalThis.onmessage = function (event) {
    const data = event.data;
    
    if (data && data.action === "test") {
      // Respond to test message with version
      globalThis.postMessage({
        action: "test",
        result: true,
        version: workerVersion
      });
    }
  };

  // Signal that the worker is ready
  globalThis.postMessage({
    action: "ready",
    result: true,
    version: workerVersion
  });

})();
