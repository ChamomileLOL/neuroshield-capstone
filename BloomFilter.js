class BloomFilter {
    // 1. Build the Grid (The Memory)
    constructor(size = 100) {
        // Create a list of 100 "False" switches (Off)
        this.storage = new Array(size).fill(false);
        this.size = size;
    }

    // 2. The Math Formula (Hash Function)
    // Converts a string ("bad") into a number (Index 0-99)
    hash(string) {
        let total = 0;
        for (let i = 0; i < string.length; i++) {
            total += string.charCodeAt(i); // Add up the ASCII codes
        }
        return total % this.size; // Ensure it fits in our grid
    }

    // 3. Add a "Dirty Thought" to the blocklist
    add(string) {
        const index = this.hash(string);
        this.storage[index] = true; // Flip the switch ON
    }

    // 4. Check if a word is dirty
    contains(string) {
        const index = this.hash(string);
        return this.storage[index]; // Is the switch ON?
    }
}

module.exports = BloomFilter;