import { Container } from "@sapphire/pieces";
import Cryptr from "cryptr";

const { CRYPT_SECRET } = process.env;

export default class Crypt extends Cryptr {
    private readonly container: Container;

    constructor(container: Container) {
        super(CRYPT_SECRET as string);

        this.container = container;
    }
}
