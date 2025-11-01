import readline from "readline";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config(); // Load .env file

const askForJwtCode = (): Promise<string> => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Enter the JWT token: ", (code) => {
      rl.close();
      if (!code) {
        console.log("No code provided.");
        process.exit(1); // Exit if no code is provided
      }
      resolve(code);
    });
  });
};

const setJwtToken = async () => {
  const code = await askForJwtCode(); // Wait for user input

  const envPath = path.resolve(__dirname, "../../../.env");

  // Read existing .env file
  let envContent = fs.readFileSync(envPath, "utf8");

  // Replace the existing token if found, otherwise append it
  if (envContent.includes("ANILIST_JWT=")) {
    envContent = envContent.replace(/ANILIST_JWT=.*/, `ANILIST_JWT=${code}`);
  } else {
    envContent += `\nANILIST_JWT=${code}\n`;
  }

  fs.writeFileSync(envPath, envContent, "utf8");
  console.log("Authentication token set!");
};

export default setJwtToken;
