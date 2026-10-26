"use client";

import { BeforeAfter, WorkflowStepper } from "./Intro";
import { CleaningDemo, DatasetAnatomy, Exercise1, Exercise2, PromptBuilder, StatsPlayground } from "./DataWidgets";
import { ChartChooser, ChartGallery, FunctionTabs } from "./VizWidgets";
import { Forecast, Scenario, Segmentation, WhatIf } from "./AdvancedWidgets";
import { Capstone, HallucinationSpotter, ValidationChecklist } from "./ResponsibleWidgets";
import { PiiScanner } from "./PiiScanner";

export const WIDGETS: Record<string, React.ComponentType> = {
  workflow: WorkflowStepper,
  beforeAfter: BeforeAfter,
  datasetAnatomy: DatasetAnatomy,
  cleaningDemo: CleaningDemo,
  promptBuilder: PromptBuilder,
  statsPlayground: StatsPlayground,
  exercise1: Exercise1,
  functionTabs: FunctionTabs,
  chartChooser: ChartChooser,
  chartGallery: ChartGallery,
  exercise2: Exercise2,
  segmentation: Segmentation,
  whatIf: WhatIf,
  scenario: Scenario,
  forecast: Forecast,
  piiScanner: PiiScanner,
  hallucinationSpotter: HallucinationSpotter,
  validationChecklist: ValidationChecklist,
  capstone: Capstone,
};
