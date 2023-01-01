const LZString = {
  // Converts an ASCII code to a character
  fromCharCode: String.fromCharCode,

  // Base64 encoding key string
  base64KeyString: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

  // URI-safe encoding key string
  uriSafeKeyString: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",

  // Reverse dictionary for base encoding
  baseReverseDictionary: {},

  // Returns the base value for the given base and character
  getBaseValue(base, character) {
    // Create reverse dictionary if it doesn't exist
    if (!this.baseReverseDictionary[base]) {
      this.baseReverseDictionary[base] = {};
      for (let i = 0; i < base.length; i++) {
        this.baseReverseDictionary[base][base[i]] = i;
      }
    }

    // Return the base value for the given character
    return this.baseReverseDictionary[base][character];
  },

  // Compresses the given string to a base64-encoded string
  compressToBase64(string) {
    // Return an empty string if the input is null
    if (string == null) return "";

    // Compress the string and convert to base64
    const compressed = this._compress(string, 6, function(code) {
      return this.base64KeyString.charAt(code);
    });

    // Add padding to the compressed string if necessary
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

  // Decompresses a base64-encoded string to the original string
  decompressFromBase64(string) {
    // Return an empty string if the input is null
    if (string == null) return "";

    // Return null if the input is an empty string
    if (string === "") return null;

    // Decompress the string and convert from base64
    return this._decompress(string.length, 32, function(index) {
      return this.getBaseValue(this.base64KeyString, string.charAt(index));
    });
  },

  // Compresses the given string to a UTF-16 encoded string
  compressToUTF16(string) {
    // Return an empty string if the input is null
    if (string == null) return "";

    // Compress the string and convert to UTF-16
    return this._compress(string, 15, function(code) {
      return String.fromCharCode(code + 32);
    }) + " ";
  },

  // Decompresses a UTF-16 encoded string to the original string
  decompressFromUTF16(string) {
    // Return an empty string if the input is null
    if (string == null) return "";

    // Return null if the input is an empty string
    if (string === "") return null;

    // Decompress the string and convert from UTF-16
    return this._decompress(string.length, 16384, function(index) {
      return string.charCodeAt(index) - 32;
    });
  },

  // Compresses the given string to a Uint8Array
  compressToUint8Array(string) {    // Compress the string and convert to a Uint8Array
    const compressed = this.compress(string);
    const uint8Array = new Uint8Array(2 * compressed.length);
    for (let i = 0; i < compressed.length; i++) {
      const code = compressed.charCodeAt(i);
      uint8Array[2 * i] = code >>> 8;
      uint8Array[2 * i + 1] = code % 256;
    }
    return uint8Array;
  },

  // Decompresses a Uint8Array to the original string
  decompressFromUint8Array(uint8Array) {
    // Return null if the input is null or undefined
    if (uint8Array == null) return null;

    // Convert the Uint8Array to a string
    const array = [];
    for (let i = 0; i < uint8Array.length; i++) {
      array.push(uint8Array[i]);
    }
    const string = array.map(function(code) {
      return String.fromCharCode(code);
    }).join("");

    // Decompress the string
    return this.decompress(string);
  },

  // Compresses the given string to an encoded URI component
  compressToEncodedURIComponent(string) {
    // Return an empty string if the input is null
    if (string == null) return "";

    // Compress the string and convert to an encoded URI component
    return this._compress(string, 6, function(code) {
      return this.uriSafeKeyString.charAt(code);
    });
  },

  // Decompresses an encoded URI component to the original string
  decompressFromEncodedURIComponent(string) {
    // Return an empty string if the input is null
    if (string == null) return "";

    // Return null if the input is an empty string
    if (string === "") return null;

    // Decompress the string and convert from an encoded URI component
    return this._decompress(string.length, 32, function(index) {
      return this.getBaseValue(this.uriSafeKeyString, string.charAt(index));
    });
  },

  // Compresses the given string
  compress(string) {
    // Return an empty string if the input is null
    if (string == null) return "";

    // Compress the string and return the result
    return this._compress(string, 16, function(code) {
      return String.fromCharCode(code);
    });
  },

  // Private function for compressing a string
  _compress(string, bitsPerChar, getCharFromInt) {
    // Initialize variables for the loop
    let value = 0;
    let position = 0;
    let dictionary = {};
    let result = "";
    let w;
    let c;

    // Loop through each character in the string
    for (let i = 0; i < string.length; i++) {
      // Get the character at the current position
      c = string[i];

      // Check if the character is in the dictionary
      if (dictionary[c] !== undefined) {
        // Set the word to the character
        w = c;
      } else {
        // Set the word to the current character and the next character
        w = c + string[i + 1];
      }

      // Check if the word is in the dictionary
      if (dictionary[w] !== undefined) {
        // Update the value and position
        value = (value << bitsPerChar) + dictionary[w];
        position += bitsPerChar;
      } else {
        // Add the current value to the result
        result += getCharFromInt(value >> position);
        position = position - bitsPerChar;

        // Add the new word to the dictionary
        dictionary[w] = bitsPerChar;
        value = (value << bitsPerChar) + bitsPerChar;
        position += bitsPerChar;
      }
    }

    // Add the remaining value to the result
    result += getCharFromInt(value >> position);

    // Return the result
    return result;
  },

  // Decompresses the given string
  decompress(string) {
    // Return an empty string if the input is null
    if (string == null) return "";

    // Initialize variables for the loop
    let dictionary = [];
    let nextChar = "";
    let word = "";
    let result = "";
    let entry = "";
    let value = 0;
    let position = 0;

    // Loop through each character in the string
    for (let i = 0; i < string.length; i++) {
      // Get the character at the current position
      c = string[i];

      // Check if the character is a number
      if (+c === c) {
        // Update the value and position
        value = (value << bitsPerChar) + c;
        position += bitsPerChar;
      } else       // Update the dictionary with the new entry
      dictionary.push(entry);

      // Set the next character to the entry
      nextChar = entry;

      // Initialize the result to the next character
      result = nextChar;

      // Loop through the rest of the string
      for (; i < string.length; i++) {
        // Get the character at the current position
        c = string[i];

        // Check if the character is a number
        if (+c === c) {
          // Update the value and position
          value = (value << bitsPerChar) + c;
          position += bitsPerChar;
        } else {
          // Check if the value is within the dictionary range
          if (value in dictionary) {
            // Set the word to the value in the dictionary
            word = dictionary[value];
          } else {
            // Set the word to the next character and the first character of the current entry
            word = nextChar + entry[0];
          }

          // Update the result with the word
          result += word;

          // Update the dictionary with the new entry
          dictionary.push(word);

          // Set the next character to the first character of the current entry
          nextChar = entry;
        }
      }
    }

    // Return the result
    return result;
  }
};
