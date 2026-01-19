import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';

export default [appConfig, databaseConfig, jwtConfig];

export { default as appConfig } from './app.config';
export { default as databaseConfig } from './database.config';
export { default as jwtConfig } from './jwt.config';
