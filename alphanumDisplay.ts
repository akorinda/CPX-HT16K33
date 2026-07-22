/**
 * Extension for Adafruit Quad Alphanumeric HT16K33 Display (0.54" 14-segment)
 */
//% color="#E67E22" icon="f13d" block="Alpha Display"
namespace alphaDisplay {
    let _i2cAddr: number = 0x70;
    let _shiftIntervalMs: number = 300;
    let _initialized: boolean = false;

    // 14-Segment ASCII Font Table (0x20 ' ' to 0x5A 'Z')
    const ALPHA_FONT: number[] = [
        0x0000, // ' '
        0x0006, // '!'
        0x0202, // '"'
        0x12CE, // '#'
        0x12ED, // '$'
        0x0C24, // '%'
        0x2359, // '&'
        0x0200, // '\''
        0x2400, // '('
        0x0900, // ')'
        0x3FFF, // '*'
        0x12C0, // '+'
        0x0800, // ','
        0x00C0, // '-'
        0x4000, // '.'
        0x0C00, // '/'
        0x0C3F, // '0'
        0x0406, // '1'
        0x00DB, // '2'
        0x008F, // '3'
        0x00E6, // '4'
        0x2069, // '5'
        0x00FD, // '6'
        0x0007, // '7'
        0x00FF, // '8'
        0x00EF, // '9'
        0x1200, // ':'
        0x0A00, // ';'
        0x2400, // '<'
        0x00C8, // '='
        0x0900, // '>'
        0x1083, // '?'
        0x0BBF, // '@'
        0x00F7, // 'A'
        0x128F, // 'B'
        0x0039, // 'C'
        0x120F, // 'D'
        0x0079, // 'E'
        0x0071, // 'F'
        0x00BD, // 'G'
        0x00F6, // 'H'
        0x1200, // 'I'
        0x001E, // 'J'
        0x2470, // 'K'
        0x0038, // 'L'
        0x0536, // 'M'
        0x2136, // 'N'
        0x003F, // 'O'
        0x00F3, // 'P'
        0x203F, // 'Q'
        0x20F3, // 'R'
        0x00ED, // 'S'
        0x1201, // 'T'
        0x003E, // 'U'
        0x0C30, // 'V'
        0x2836, // 'W'
        0x2D00, // 'X'
        0x1500, // 'Y'
        0x0C09  // 'Z'
    ];

    function writeCmd(cmd: number) {
        let buf = pins.createBuffer(1);
        buf[0] = cmd;
        pins.i2cWriteBuffer(_i2cAddr, buf);
    }

    function getFontMask(char: string): number {
        let code = char.charCodeAt(0);
        
        if (code >= 97 && code <= 122) {
            code = code - 32;
        }

        if (code >= 32 && code <= 90) {
            return ALPHA_FONT[code - 32];
        }
        
        return 0x0000;
    }

    function writeRawDigits(mask0: number, mask1: number, mask2: number, mask3: number) {
        let buf = pins.createBuffer(9);
        buf[0] = 0x00;
        
        buf[1] = mask0 & 0xFF;
        buf[2] = (mask0 >> 8) & 0xFF;
        buf[3] = mask1 & 0xFF;
        buf[4] = (mask1 >> 8) & 0xFF;
        buf[5] = mask2 & 0xFF;
        buf[6] = (mask2 >> 8) & 0xFF;
        buf[7] = mask3 & 0xFF;
        buf[8] = (mask3 >> 8) & 0xFF;

        pins.i2cWriteBuffer(_i2cAddr, buf);
    }

    /**
     * Initialize the HT16K33 Alphanumeric display.
     * @param addr I2C address, default 112 (0x70)
     */
    //% blockId="alpha_init" block="initialize alphanumeric display at address %addr"
    //% addr.defl=112
    //% weight=100
    export function initializeAlphanumericDisplay(addr: number = 112): void {
        _i2cAddr = addr;
        writeCmd(0x21);
        setBlinkRate(0);
        setBrightness(15);
        clear();
        _initialized = true;
    }

    /**
     * Clear all segments on the display.
     */
    //% blockId="alpha_clear" block="clear display"
    //% weight=95
    export function clear(): void {
        writeRawDigits(0, 0, 0, 0);
    }

    /**
     * Set display brightness from 0 to 15.
     * @param brightness brightness level from 0 to 15, default 15
     */
    //% blockId="alpha_set_brightness" block="set brightness to %brightness"
    //% brightness.min=0 brightness.max=15 brightness.defl=15
    //% weight=90
    export function setBrightness(brightness: number = 15): void {
        if (brightness < 0) brightness = 0;
        if (brightness > 15) brightness = 15;
        writeCmd(0xE0 | brightness);
    }

    /**
     * Set display blink rate.
     * @param rate rate 0=off, 1=2Hz, 2=1Hz, 3=0.5Hz
     */
    //% blockId="alpha_set_blink" block="set blink rate to %rate"
    //% rate.min=0 rate.max=3 rate.defl=0
    //% weight=85
    export function setBlinkRate(rate: number = 0): void {
        if (rate < 0) rate = 0;
        if (rate > 3) rate = 3;
        writeCmd(0x81 | (rate << 1));
    }

    /**
     * Set scrolling interval in milliseconds.
     * @param ms milliseconds per shift
     */
    //% blockId="alpha_set_shift_interval" block="set shift interval to %ms ms"
    //% ms.defl=300
    //% weight=80
    export function setShiftInterval(ms: number = 300): void {
        if (ms < 50) ms = 50;
        _shiftIntervalMs = ms;
    }

    /**
     * Show a string of text. Auto-scrolls if longer than 4 characters.
     * @param text string to show
     */
    //% blockId="alpha_show_string" block="show string %text"
    //% text.defl="CPX"
    //% weight=75
    export function showString(text: string): void {
        if (!_initialized) {
            initializeAlphanumericDisplay(112);
        }

        if (text.length <= 4) {
            let padded = text + "    ";
            writeRawDigits(
                getFontMask(padded.charAt(0)),
                getFontMask(padded.charAt(1)),
                getFontMask(padded.charAt(2)),
                getFontMask(padded.charAt(3))
            );
        } else {
            let scrollText = text + "    ";
            for (let i = 0; i <= scrollText.length - 4; i++) {
                writeRawDigits(
                    getFontMask(scrollText.charAt(i)),
                    getFontMask(scrollText.charAt(i + 1)),
                    getFontMask(scrollText.charAt(i + 2)),
                    getFontMask(scrollText.charAt(i + 3))
                );
                basic.pause(_shiftIntervalMs);
            }
        }
    }

    /**
     * Show a number right-aligned.
     * @param num number to display
     */
    //% blockId="alpha_show_number" block="show number %num"
    //% num.defl=1234
    //% weight=70
    export function showNumber(num: number): void {
        let str = num.toString();
        
        if (str.length > 4) {
            str = str.substring(0, 4);
        } else {
            while (str.length < 4) {
                str = " " + str;
            }
        }
        
        showString(str);
    }
}
