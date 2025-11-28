class TrieNode {
    constructor() {
        this.children = {}; // Branches to other letters
        this.isTrigger = false; // Is this the end of a bad word?
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    // 1. Learn a new Trigger
    insert(word) {
        let currentNode = this.root;
        // Walk down the tree, letter by letter
        for (let char of word) {
            // If the branch doesn't exist, grow it
            if (!currentNode.children[char]) {
                currentNode.children[char] = new TrieNode();
            }
            currentNode = currentNode.children[char];
        }
        // Mark the end of the word as DANGER
        currentNode.isTrigger = true;
    }

    // 2. Scan a sentence for ANY triggers
    searchInSentence(sentence) {
        // Break sentence into words ("I am chewing") -> ["I", "am", "chewing"]
        const words = sentence.split(" ");

        for (let word of words) {
            if (this.checkWord(word)) {
                return word; // Found one! Return the bad word.
            }
        }
        return null; // Safe.
    }

    // Helper: Check a single word
    checkWord(word) {
        let currentNode = this.root;
        for (let char of word) {
            if (!currentNode.children[char]) {
                return false; // Path broke, word not found
            }
            currentNode = currentNode.children[char];
        }
        return currentNode.isTrigger;
    }
}

module.exports = Trie;