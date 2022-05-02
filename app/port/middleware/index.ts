import { Middleware } from '@eggjs/tegg';
import { ErrorHandler } from './ErrorHandler';
import { Tracing } from './Tracing';

@Middleware(Tracing)
@Middleware(ErrorHandler)
export abstract class MiddlewareController {}
