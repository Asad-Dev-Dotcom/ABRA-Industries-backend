import dotenv from "dotenv";
dotenv.config();

const config = Object.freeze({
  // global credentials
  // ------------------
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URL: process.env.MONGODB_URL,
  MONGODB_NAME: process.env.MONGODB_NAME,

  // jwt token credentials
  // ---------------------
  ACCESS_TOKEN_EXPIRY_TIME: process.env.ACCESS_TOKEN_EXPIRY_TIME,
  ACCESS_TOKEN_MAX_AGE: process.env.ACCESS_TOKEN_MAX_AGE,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_NAME: process.env.ACCESS_TOKEN_NAME,
  REFRESH_TOKEN_EXPIRY_TIME: process.env.REFRESH_TOKEN_EXPIRY_TIME,
  REFRESH_TOKEN_MAX_AGE: process.env.REFRESH_TOKEN_MAX_AGE,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_NAME: process.env.REFRESH_TOKEN_NAME,
  VERIFICATION_TOKEN_SECRET: process.env.VERIFICATION_TOKEN_SECRET,
  VERIFICATION_TOKEN_EXPIRY_TIME: process.env.VERIFICATION_TOKEN_EXPIRY_TIME,

  // cloudinary credentials
  // ---------------------
  CLOUDINARY_CLIENT_KEY: process.env.CLOUDINARY_CLIENT_KEY,
  CLOUDINARY_CLIENT_NAME: process.env.CLOUDINARY_CLIENT_NAME,
  CLOUDINARY_CLIENT_SECRET: process.env.CLOUDINARY_CLIENT_SECRET,
  CLOUDINARY_FOLDER_NAME: process.env.CLOUDINARY_FOLDER_NAME,

  //nodemailer configs
  // -----------------
  NODEMAILER_FROM: process.env.NODEMAILER_FROM,
  NODEMAILER_HOST: process.env.NODEMAILER_HOST,
  NODEMAILER_PASSWORD: process.env.NODEMAILER_PASSWORD,
  NODEMAILER_PORT: process.env.NODEMAILER_PORT,
  NODEMAILER_USER: process.env.NODEMAILER_USER,

  // fonts configs
  // -------------
  FONTS_PATH: process.env.FONTS_PATH,

  // sendgrid configs
  // --------------
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  SENDGRID_MAIL_FROM: process.env.SENDGRID_MAIL_FROM,

  // logo configs
  // ------------
  LOGO_URL_WITH_BACKGROUND: process.env.LOGO_URL_WITH_BACKGROUND,
  LOGO_URL_WITHOUT_BACKGROUND: process.env.LOGO_URL_WITHOUT_BACKGROUND,
  CHARITY_LOGO: process.env.CHARITY_LOGO,

  // stripe configs
  // --------------
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
});

const getEnv = (key) => {
  const value = config[key];
  if (!value) throw new Error(`Config ${key} not found`);
  return value;
};

export { getEnv };
