import { Builder, Browser, By, until, WebDriver } from "selenium-webdriver";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE_URL = process.env.BASE_URL ?? "https://www.saucedemo.com";
const USERNAME = "standard_user";
const PASSWORD = "secret_sauce";

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

async function saveScreenshot(driver: WebDriver, name: string): Promise<void> {
    mkdirSync("screenshots", { recursive: true });
    const image = await driver.takeScreenshot();
    writeFileSync(`screenshots/${name}.png`, image, "base64");
}

async function main(): Promise<void> {
    const driver = await new Builder()
        .forBrowser(Browser.CHROME)
        .build();

    let passed = false;

    try {
        // 1. Open the login page
        await driver.get(BASE_URL);
        await driver.manage().window().maximize();
        await driver.wait(until.elementLocated(By.id("login-button")), 10000);

        // 2. Enter valid username and password
        await driver.findElement(By.id("user-name")).sendKeys(USERNAME);
        await driver.findElement(By.id("password")).sendKeys(PASSWORD);
        await saveScreenshot(driver, "01-before-login");

        // 3. Click the login button
        await driver.findElement(By.id("login-button")).click();

        // 4. Verify the user reaches the inventory (home) page
        await driver.wait(until.urlContains("inventory.html"), 10000);
        const currentUrl = await driver.getCurrentUrl();
        assert(currentUrl.includes("/inventory.html"), `URL should contain /inventory.html but was ${currentUrl}`);

        const pageTitle = await driver.findElement(By.css(".title")).getText();
        assert(pageTitle === "Products", `Page heading should be "Products" but was "${pageTitle}"`);

        const items = await driver.findElements(By.className("inventory_item"));
        assert(items.length > 0, "Product list should not be empty");

        await saveScreenshot(driver, "02-after-login");
        passed = true;
    } catch (error) {
        await saveScreenshot(driver, "error").catch(() => undefined);
        console.error(error instanceof Error ? error.message : error);
    } finally {
        await driver.sleep(8000);
        await driver.quit();
    }

    console.log(passed ? "TEST PASSED: Login flow successful" : "TEST FAILED: Login flow failed");
    process.exitCode = passed ? 0 : 1;
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
