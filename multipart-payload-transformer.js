/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import { PolymerElement } from '../../@polymer/polymer/polymer-element.js';

/**
 * An element that contains methods to transform FormData object
 * into Multipart message and ArrayBuffer
 *
 * ## Example
 *
 * ```html
 * <multipart-payload-transformer form-data="[[formData]]"></multipart-payload-transformer>
 * ```
 *
 * ## Changes in version 2.0
 * - The element does not includes polyfill by default. Use
 * `advanced-rest-client/fetch-polyfill` and `advanced-rest-client/arc-polyfills`
 * if targeting browsers that does not support Fetch API.
 *
 * @customElement
 * @polymer
 * @memberof ApiElements
 */
class MultipartPayloadTransformer extends PolymerElement {
  static get is() { return 'multipart-payload-transformer'; }
  static get properties() {
    return {
      /**
       * A form data object to transform.
       *
       * @type {FormData}
       */
      formData: Object,
      /**
       * Latest generated boundary value for the multipart forms.
       * Each call to `generateMessage()` or `generatePreview()` will
       * generate new content type and therefore boundary value.
       */
      boundary: {
        type: String,
        notify: true
      },
      /**
       * Latest generated content-type value for the multipart forms.
       * Each call to `generateMessage()` or `generatePreview()` will
       * generate new content type value.
       */
      contentType: {
        type: String,
        notify: true
      }
    };
  }
  /**
   * Generates an ArrayBuffer instance from the FormData object.
   *
   * @return {Promise<String>} A resolved promise when produces ArrayBuffer.
   */
  generateMessage() {
    /* global Request */
    const request = new Request('/', {
      method: 'POST',
      body: this.formData
    });
    const ct = request.headers.get('content-type');
    this._processContentType(ct);
    if (!request.arrayBuffer) {
      return Promise.reject(new Error('Your browser do not support this method.'));
    }
    return request.arrayBuffer();
  }
  /**
   * Informs other ARC elements about content type change.
   * If boundary is added to the content type string then it is reported in
   * a separate event.
   *
   * @param {String} contentType New cintent type.
   */
  _processContentType(contentType) {
    this.set('contentType', contentType);
    this.dispatchEvent(new CustomEvent('content-type-changed', {
      bubbles: true,
      composed: true,
      detail: {
        value: contentType
      }
    }));
    const match = contentType.match(/boundary=(.*)/);
    if (!match) {
      return;
    }
    const boundary = match[1];
    this.set('boundary', boundary);
    this.dispatchEvent(new CustomEvent('multipart-boundary-changed', {
      bubbles: true,
      composed: true,
      detail: {
        value: boundary
      }
    }));
  }
  /**
   * Generates a preview of the multipart messgae.
   *
   * @return {Promise<String>} A promise resolved to a string message.
   */
  generatePreview() {
    if (!this.formData) {
      return Promise.reject(new Error('The FormData property is not set.'));
    }
    return this.generateMessage()
    .then((ab) => this.arrayBufferToString(ab));
  }
  /**
   * Convert ArrayBuffer to readable form
   * @param {ArrayBuffer} buff
   * @returns {String} Converted string
   */
  arrayBufferToString(buffer) {
    if (!!buffer.buffer) {
      // Not a ArrayBuffer, need and instance of AB
      // It can't just get buff.buffer because it will use original buffer if the buff is a slice
      // of it.
      const b = buffer.slice(0);
      buffer = b.buffer;
    }
    if ('TextDecoder' in window) {
      const view = new DataView(buffer);
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(view);
    }
    const array = new Uint8Array(buffer);
    let str = '';
    for (let i = 0; i < array.length; ++i) {
      str += String.fromCharCode(array[i]);
    }
    return str;
  }
  /**
   * Dispatched when a message is generated from the FormData. This operation
   * changes boundary added to the header.
   *
   * @event content-type-changed
   * @param {String} value New value of the content type.
   */
  /**
   * Dispatched when boundary is generated
   *
   * @event multipart-boundary-changed
   * @param {String} value New value of the boundary
   */

}
window.customElements.define(MultipartPayloadTransformer.is, MultipartPayloadTransformer);