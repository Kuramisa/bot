import Cryptr from "cryptr";

const { CRYPT_SECRET } = process.env;

export default class Crypt extends Cryptr {
    constructor() {
        super(CRYPT_SECRET ?? "");
    }
}
