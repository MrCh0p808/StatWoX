import serverless from "serverless-http";
import app from "./index";

// wrapping my express app with serverless-http so it can run on aws lambda
export const handler = serverless(app);