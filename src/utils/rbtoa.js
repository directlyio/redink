import r from 'rethinkdb';

export default r.js(`(${
  function btoa(input) {
    const codes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var output = ''; // eslint-disable-line
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4; // eslint-disable-line
    var i = 0; // eslint-disable-line
    while (i < input.length) {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
      if (isNaN(chr2)) enc3 = enc4 = 64;
      else if (isNaN(chr3)) enc4 = 64;
      output = output
        + codes.charAt(enc1)
        + codes.charAt(enc2)
        + codes.charAt(enc3)
        + codes.charAt(enc4);
    }
    return output;
  }
})`);
