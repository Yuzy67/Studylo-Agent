import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai";
import studyloRouter from "./studylo";

const router: IRouter = Router();

router.use(healthRouter);
router.use(openaiRouter);
router.use(studyloRouter);

export default router;
