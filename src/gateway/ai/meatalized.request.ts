import { Express } from 'express';

export interface MetalizedRequest {
    file: Express.Multer.File;
}