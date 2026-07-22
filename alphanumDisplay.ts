/**
 * Extension for Adafruit Quad Alphanumeric HT16K33 Display (0.54" 14-segment)
 */
//% color="#E67E22" icon="\uf13d" block="Alpha Display"
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

    /**
     * Helper to write a single byte command to the HT16K33 chip.
     */
    function writeCmd(cmd: number) {
        let buf = pins.createBuffer(1);
        buf[0] = cmd;
        pins.i2cWriteBuffer(_i2cAddr, buf);
    }

    /**
     * Map characters to 14-segment mask values with lower-case normalization.
     */
    function getFontMask(char: string): number {
        let code = char.charCodeAt(0);
        
        // Normalize lower-case 'a-z' to upper-case 'A-Z'
        if (code >= 97 && code <= 122) {
            code -= 32;
        }

        // Map valid ASCII standard bounds
        if (code >= 32 && code <= 90) {
            return ALPHA_FONT[code - 32];
        }
        
        return 0x0000; // Default blank digit for out-of-bounds chars
    }

    /**
     * Transmit digit segment masks as a single 9-byte contiguous buffer payload.
     */
    function writeRawDigits(mask0: number, mask1: number, mask2: number, mask3: number) {
        let buf = pins.createBuffer(9);
        buf[0] = 0x00; // Start RAM target register address
        
        const masks = [mask0, mask1, mask2, mask3];
        for (let i = 0; i < 4; i++) {
            buf[1 + i * 2] = masks[i] & 0xFF;        // Low Byte (Segments A-H)
            buf[2 + i * 2] = (masks[i] >> 8) & 0xFF; // High Byte (Segments I-N)
        }
        pins.i2cWriteBuffer(_i2cAddr, buf);
    }

    /**
     * Initialize the HT16K33 Alphanumeric display.
     * @param addr I2C address (default is 112 / 0x70)
     */
    //% blockId="alpha_init" block="Initialize Alphanumeric Display at address %addr"
    //% addr.defl=112
    //% weight=100
    export function initializeAlphanumericDisplay(addr: number = 112): void {
        _i2cAddr = addr;
        writeCmd(0x21); // Turn on system clock oscillator
        setBlinkRate(0); // Set display ON with blinking disabled
        setBrightness(15); // Default to full brightness
        clear();
        _initialized = true;
    }

    /**
     * Clear all segments on the display.
     */
    //% blockId="alpha_clear" block="Clear Display"
    //% weight=95
    export function clear(): void {
        writeRawDigits(0, 0, 0, 0);
    }

    /**
     * Set the display brightness (0 to 15).
     * @param brightness level from 0 (dim) to 15 (max brightness)
     */
    //% blockId="alpha_set_brightness" block="Set Brightness %brightness"
    //% brightness.min=0 brightness.max=15 brightness.defl=15
    //% weight=90
    export function setBrightness(brightness: number): void {
        brightness = Math.clamp(0, 15, brightness);
        writeCmd(0xE0 | brightness);
    }

    /**
     * Set the display blink rate.
     * @param rate 0 = Off, 1 = 2Hz, 2 = 1Hz, 3 = 0.5Hz
     */
    //% blockId="alpha_set_blink" block="Set Blink Rate %rate"
    //% rate.defl=0
    //% weight=85
    export function setBlinkRate(rate: number): void {
        rate = Math.clamp(0, 3, rate);
        writeCmd(0x81 | (rate << 1));
    }

    /**
     * Set the scrolling speed interval for long text strings in milliseconds.
     * @param ms delay between character shifts (minimum 50ms)
     */
    //% blockId="alpha_set_shift_interval" block="Set Shift Interval %ms ms"
    //% ms.defl=300
    //% weight=80
    export function setShiftInterval(ms: number): void {
        _shiftIntervalMs = Math.max(50, ms);
    }

    /**
     * Display a text string. Displays static text if <= 4 characters, or auto-scrolls if longer.
     * @param text text string to display
     */
    //% blockId="alpha_show_string" block="Show String %text"
    //% text.defl="HELL"
    //% weight=75
    export function showString(text: string): void {
        if (!_initialized) {
            initializeAlphanumericDisplay();
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
     * Display a number on the display (right-aligned).
     * @param num number to display (-999 to 9999)
     */
    //% blockId="alpha_show_number" block="Show Number %num"
    //% num.defl=1234
    //% weight=70
    export function showNumber(num: number): void {
        let str = num.toString();
        
        if (str.length > 4) {
            str = str.substring(0, 4);
        } else {
            // Pad spaces to the left to keep numbers right-aligned
            while (str.length < 4) {
                str = " " + str;
            }
        }
        
        showString(str);
    }
}
