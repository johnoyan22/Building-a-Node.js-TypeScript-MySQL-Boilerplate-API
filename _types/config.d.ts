export type AppConfig = {
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  secret: string;
  emailFrom: string;
  emailTo: string;
  resendApiKey: string;
  apiUrl: string;
};
