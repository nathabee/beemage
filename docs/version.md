# Version History — BeeContour — Extract the main outline

This document tracks functional and architectural changes of  
**BeeContour — Extract the main outline**.

Conventions:

- Versions are listed with the **newest at the top**
- Use:
  - `##` for **major** versions
  - `###` for **minor** versions
  - `####` for **patch** versions
- Keep entries concise and factual
 

---

## **MAJOR v0**

### **v0.x — Focus: Development and stabilization**

* Iterative development phase
* Architecture exploration and refinement
* Internal testing and demos

---

#### **v0.0.3 — Epic: Colors workflow + documentation**

* Added **Colors** tab with region-based fill workflow (palette selection, click-to-preview outline, apply fill, reset/reload)
* Introduced edge/noise controls for region detection (threshold, dilation, max region guard)
* Updated documentation to reflect the two-step workflow: **Contour extraction → Coloring**

---

#### **v0.0.2 — Epic: Contour extraction prototype**

* Added **Contour** tab with drag & drop / file input
* Implemented preview + processing pipeline to generate a contour-style output on canvas
* Added output controls (process, download PNG) and basic processing options (edge threshold, background inversion)

---

#### **v0.0.1 — Epic: Project bootstrap from generic template**

* Initialized BeeContour repository from the extension generic baseline
* Established panel scaffold (tabs, views, DOM binding pattern) and build setup
* Set up baseline documentation structure and project naming/assets alignment
