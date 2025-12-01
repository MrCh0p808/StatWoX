# 🧪 Verification Guide: How to Test StatWoX

So you've built this cool app, and now you want to make sure it actually works? Follow these simple steps.

## 1. What Are We Using?
Before we start, here's a quick cheat sheet of the tech we're using:

-   **AWS Aurora Serverless**: This is our **Database**. Think of it as a giant Excel sheet in the cloud that stores users and surveys. "Serverless" means it turns off when we don't use it (saving money!).
-   **AWS Lambda**: This is our **Backend Code**. It runs our logic (like "save this survey") only when someone clicks a button.
-   **Terraform**: This is our **Robot Builder**. Instead of clicking buttons in the AWS console, we write a file, and Terraform builds everything for us.

---

## 2. The Setup (Do This First!)
We need to tell Terraform our secrets (like DB passwords).

1.  Open your terminal (the black box where you type commands).
2.  Go to the `infra` folder:
    ```bash
    cd infra
    ```
3.  **Copy and Paste** these commands to set your environment variables (replace the values with your real ones!):

    ```bash
    # Your Database Credentials (Make these up, but remember them!)
    export TF_VAR_db_username="admin"
    export TF_VAR_db_password="SuperSecretPassword123!"

    # Your Google Login ID (From Google Cloud Console)
    export TF_VAR_google_client_id="your-google-client-id.apps.googleusercontent.com"

    # A Secret Key for Logins (Mash your keyboard)
    export TF_VAR_jwt_secret="kjsdhf87234kjhsd87234"

    # Your AWS Keys (From AWS IAM Console)
    export AWS_ACCESS_KEY_ID="AKIA..."
    export AWS_SECRET_ACCESS_KEY="wJalr..."
    export AWS_REGION="us-east-1"
    ```

---

## 3. The Launch (Build It!)
Now we tell the robot (Terraform) to build our castle.

1.  **Initialize**: Get the tools ready.
    ```bash
    terraform init
    ```
2.  **Plan**: See what it's going to build.
    ```bash
    terraform plan
    ```
3.  **Apply**: Actually build it! (Type `yes` when asked).
    ```bash
    terraform apply
    ```

**Wait for it...**
When it's done, it will spit out a green URL. **COPY THAT URL.** That is your website!

---

## 4. The Connection (Connect DB)
Now that the DB exists, we need to tell our code how to talk to it.

1.  Go back to the `backend` folder:
    ```bash
    cd ../backend
    ```
2.  Construct your **Database URL**. It looks like this:
    `postgresql://<username>:<password>@<db-endpoint>:5432/statwox`
    *   Replace `<username>` and `<password>` with what you set in Step 2.
    *   Replace `<db-endpoint>` with the `db_endpoint` Terraform showed you.

3.  **Push the Schema**: This creates the tables (Users, Surveys) in the DB.
    ```bash
    export DATABASE_URL="postgresql://admin:SuperSecretPassword123!@..."
    npx prisma db push
    ```
    *If you see "🚀 Your database is now in sync", you are a legend.*

---

## 5. The Test (Verify It!)
1.  Open the **URL** from Step 3 in your browser.
2.  **Sign Up**: Create a new account.
3.  **Login**: Try logging in with those credentials.
4.  **Create Survey**: Click "New Survey" and make a poll.
5.  **Check Health**: Go to `https://<your-api-url>/api/health`. It should say `database: connected`.

**Trouble?**
-   If login fails, check the **Console** (F12) in your browser.
-   Run `node scripts/healthcheck.js` locally to test the DB connection.

**Good luck! 🚀**
