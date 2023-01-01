const LZString = {
  // converts an ASCII code to a character
  fromCharCode: String.fromCharCode,

  // base64 encoding key string
  base64KeyString: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

  // URI-safe encoding key string
  uriSafeKeyString: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",

  // reverse dictionary for base encoding
  baseReverseDictionary: {},

  // returns the base value for the given base and character
  getBaseValue(base, character) {
    // create reverse dictionary if it doesn't exist
    if (!this.baseReverseDictionary[base]) {
      this.baseReverseDictionary[base] = {};
      for (let i = 0; i < base.length; i++) {
        this.baseReverseDictionary[base][base[i]] = i;
      }
    }

    // return the base value for the given character
    return this.baseReverseDictionary[base][character];
  },

  // compresses the given string to a base64-encoded string
  compressToBase64(string) {
    // return an empty string if the input is null
    if (string == null) return "";

    // compress the string and convert to base64
    const compressed = this._compress(string, 6, function(code) {
      return this.base64KeyString.charAt(code);
    });

    // add padding to the compressed string if necessary
    switch (compressed.length % 4) {
      case 0:
        return compressed;
      case 1:
        return `${compressed}===`;
      case 2:
        return `${compressed}==`;
      case 3:
        return `${compressed}=`;
    }
  },

  // decompresses a base64-encoded string to the original string
  decompressFromBase64(string) {
    // return an empty string if the input is null
    if (string == null) return "";

    // return null if the input is an empty string
    if (string === "") return null;

    // Decompress the string and convert from base64
    return this._decompress(string.length, 32, function(index) {
      return this.getBaseValue(this.base64KeyString, string.charAt(index));
    });
  },

  // compresses the given string to a UTF-16 encoded string
  compressToUTF16(string) {
    // return an empty string if the input is null
    if (string == null) return "";

    // compress the string and convert to UTF-16
    return this._compress(string, 15, function(code) {
      return String.fromCharCode(code + 32);
    }) + " ";
  },

  // decompresses a UTF-16 encoded string to the original string
  decompressFromUTF16(string) {
    // return an empty string if the input is null
    if (string == null) return "";

    // return null if the input is an empty string
    if (string === "") return null;

    // decompress the string and convert from UTF-16
    return this._decompress(string.length, 16384, function(index) {
      return string.charCodeAt(index) - 32;
    });
  },

  // compresses the given string to a Uint8Array
  compressToUint8Array(string) {    // compress the string and convert to a Uint8Array
    const compressed = this.compress(string);
    const uint8Array = new Uint8Array(2 * compressed.length);
    for (let i = 0; i < compressed.length; i++) {
      const code = compressed.charCodeAt(i);
      uint8Array[2 * i] = code >>> 8;
      uint8Array[2 * i + 1] = code % 256;
    }
    return uint8Array;
  },

  // decompresses a Uint8Array to the original string
  decompressFromUint8Array(uint8Array) {
    // return null if the input is null or undefined
    if (uint8Array == null) return null;

    // convert the Uint8Array to a string
    const array = [];
    for (let i = 0; i < uint8Array.length; i++) {
      array.push(uint8Array[i]);
    }
    const string = array.map(function(code) {
      return String.fromCharCode(code);
    }).join("");

    // decompress the string
    return this.decompress(string);
  },

  // compresses the given string to an encoded URI component
  compressToEncodedURIComponent(string) {
    // Return an empty string if the input is null
    if (string == null) return "";

    // compress the string and convert to an encoded URI component
    return this._compress(string, 6, function(code) {
      return this.uriSafeKeyString.charAt(code);
    });
  },

  // decompresses an encoded URI component to the original string
  decompressFromEncodedURIComponent(string) {
    // return an empty string if the input is null
    if (string == null) return "";

    // return null if the input is an empty string
    if (string === "") return null;

    // Decompress the string and convert from an encoded URI component
    return this._decompress(string.length, 32, function(index) {
      return this.getBaseValue(this.uriSafeKeyString, string.charAt(index));
    });
  },

  // compresses the given string
  compress(string) {
    // return an empty string if the input is null
    if (string == null) return "";

    // compress the string and return the result
    return this._compress(string, 16, function(code) {
      return String.fromCharCode(code);
    });
  },

  // private function for compressing a string
  _compress(string, bitsPerChar, getCharFromInt) {
    // initialize variables for the loop
    let value = 0;
    let position = 0;
    let dictionary = {};
    let result = "";
    let w;
    let c;

    // loop through each character in the string
    for (let i = 0; i < string.length; i++) {
      // get the character at the current position
      c = string[i];

      // check if the character is in the dictionary
      if (dictionary[c] !== undefined) {
        // set the word to the character
        w = c;
      } else {
        // set the word to the current character and the next character
        w = c + string[i + 1];
      }

      // check if the word is in the dictionary
      if (dictionary[w] !== undefined) {
        // update the value and position
        value = (value << bitsPerChar) + dictionary[w];
        position += bitsPerChar;
      } else {
        // add the current value to the result
        result += getCharFromInt(value >> position);
        position = position - bitsPerChar;

        // add the new word to the dictionary
        dictionary[w] = bitsPerChar;
        value = (value << bitsPerChar) + bitsPerChar;
        position += bitsPerChar;
      }
    }

    // add the remaining value to the result
    result += getCharFromInt(value >> position);

    // return the result
    return result;
  },

  // decompresses the given string
  decompress(string) {
    // return an empty string if the input is null
    if (string == null) return "";

    // initialize variables for the loop
    let dictionary = [];
    let nextChar = "";
    let word = "";
    let result = "";
    let entry = "";
    let value = 0;
    let position = 0;

    // loop through each character in the string
    for (let i = 0; i < string.length; i++) {
      // get the character at the current position
      c = string[i];

      // check if the character is a number
      if (+c === c) {
        // update the value and position
        value = (value << bitsPerChar) + c;
        position += bitsPerChar;
      } else       // update the dictionary with the new entry
      dictionary.push(entry);

      // set the next character to the entry
      nextChar = entry;

      // initialize the result to the next character
      result = nextChar;

      // loop through the rest of the string
      for (; i < string.length; i++) {
        // get the character at the current position
        c = string[i];

        // check if the character is a number
        if (+c === c) {
          // update the value and position
          value = (value << bitsPerChar) + c;
          position += bitsPerChar;
        } else {
          // check if the value is within the dictionary range
          if (value in dictionary) {
            // set the word to the value in the dictionary
            word = dictionary[value];
          } else {
            // set the word to the next character and the first character of the current entry
            word = nextChar + entry[0];
          }

          // update the result with the word
          result += word;

          // update the dictionary with the new entry
          dictionary.push(word);

          // set the next character to the first character of the current entry
          nextChar = entry;
        }
      }
    }

    // Return the result
    return result;
  }
};
