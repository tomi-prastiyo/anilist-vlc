import readline from "readline";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config(); // Load .env file

const askForAuthCode = (): Promise<string> => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Enter the authorization code: ", (code) => {
      rl.close();
      if (!code) {
        console.log("No code provided.");
        process.exit(1); // Exit if no code is provided
      }
      resolve(code);
    });
  });
};

const setAuthToken = async () => {
  const code = await askForAuthCode(); // Wait for user input

  const envPath = path.resolve(__dirname, "../../../.env");

  // Read existing .env file
  let envContent = fs.readFileSync(envPath, "utf8");

  // Replace the existing token if found, otherwise append it
  if (envContent.includes("ANILIST_AUTHTOKEN=")) {
    envContent = envContent.replace(
      /ANILIST_AUTHTOKEN=.*/,
      `ANILIST_AUTHTOKEN=${code}`
    );
  } else {
    envContent += `\nANILIST_AUTHTOKEN=${code}\n`;
  }

  fs.writeFileSync(envPath, envContent, "utf8");
  console.log("Authentication token set!");
};

export default setAuthToken;
