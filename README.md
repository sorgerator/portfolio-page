# Tarik Sorguč — Personal Portfolio

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=flat-square&logo=netlify&logoColor=white)](https://www.netlify.com/)

A modern, fast, and responsive personal portfolio website for **Tarik Sorguč**, Data Science & AI Engineering student at International Burch University and Machine Learning Intern at FlyRank AI.

---

## 🌟 Overview

This portfolio showcases selected engineering projects, technical case studies, professional background, and interactive contact channels. Built with vanilla web technologies, the site achieves high performance, zero external framework dependencies, and a clean dark-themed UI.

---

## ✨ Features

- **🎨 Modern Dark UI / UX**: Clean dark-mode aesthetic with crimson accent highlights, glassmorphism cards, and typography powered by [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) and [Inter](https://fonts.google.com/specimen/Inter).
- **📂 Case Studies & Projects**: Highlights engineering work (e.g., FlyRank ML search intelligence capstone, multimodal data ingestion pipelines, automated LLM outreach systems) with tech tags and direct GitHub links.
- **✉️ Interactive Contact Modal**: Asynchronous contact form integration with [Netlify Forms](https://www.netlify.com/products/forms/), client-side validation, and instant feedback alerts.
- **📅 Embedded Appointment Scheduling**: Integrated [Google Calendar Appointment Scheduling](https://calendar.google.com/) embed with a collapsible accordion toggle.
- **📱 Fully Responsive Design**: Mobile-friendly navigation drawer with hamburger animation, adaptive grid layouts, and touch-friendly interactions across desktop, tablet, and mobile screens.
- **🔍 SEO & Social Sharing**: Preconfigured Open Graph meta tags, semantic HTML5 markup, and favicon assets.

---

## 📁 Project Structure

```text
portfolio-page/
├── assets/
│   ├── Tarik_Sorguc_CV.pdf     # Downloadable Curriculum Vitae (PDF)
│   └── logo_ss.png             # Site logo, favicon, and Open Graph image
├── src/
│   ├── app.js                  # Client-side JavaScript (modal, form handling, calendar, nav)
│   └── styles.css              # Custom CSS styles, variables, components, and media queries
├── index.html                  # Main portfolio landing page
└── README.md                   # Project documentation
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **HTML5** | Semantic document structure and accessibility attributes (`aria-*`) |
| **CSS3** | Modern layout (CSS Grid & Flexbox), CSS Custom Properties, animations, and responsive media queries |
| **JavaScript (ES6+)** | Dynamic interactions, modal state management, event listeners, and asynchronous form submission |
| **Netlify Forms** | Serverless form submission handling with spam prevention honeypot |
| **Google Calendar** | Direct meeting booking widget integration |

---

## 🚀 Getting Started

### Prerequisites

No build tools, package managers, or frameworks are required. You only need a modern web browser.

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sorgerator/portfolio-page.git
   cd portfolio-page
   ```

2. **Run locally**:
   - **Directly in browser**: Double-click `index.html` or open it via your browser.
   - **Using VS Code Live Server**: Right-click `index.html` and select **"Open with Live Server"**.
   - **Using Python HTTP server**:
     ```bash
     python -m http.server 8000
     ```
     Open `http://localhost:8000` in your browser.
   - **Using Node.js `serve`**:
     ```bash
     npx serve .
     ```

---

## 🌐 Deployment

### Netlify (Recommended)

1. Push your repository to GitHub.
2. Log in to [Netlify](https://app.netlify.com/) and click **"Add new site"** > **"Import an existing project"**.
3. Select your `portfolio-page` repository.
4. Leave the build command empty and set the publish directory to `.` (root).
5. Deploy the site. Netlify will automatically detect the form (`name="contact"`) and enable Netlify Forms.

### GitHub Pages / Other Static Hosts

You can host this project on GitHub Pages or Vercel:
- **GitHub Pages**: Go to **Repository Settings** > **Pages** > Select `main` branch and `/ (root)` folder > Save.

---

## 📬 Contact & Socials

- **Author**: Tarik Sorguč
- **Email**: [tarik.sorguc1@gmail.com](mailto:tarik.sorguc1@gmail.com)
- **LinkedIn**: [linkedin.com/in/tarik-sorguc-27137523b](https://www.linkedin.com/in/tarik-sorguc-27137523b/)
- **GitHub**: [@sorgerator](https://github.com/sorgerator)
- **Internship Verification**: [FlyRank AI Graduate Verification](https://internship.flyrank.ai/intern)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) (or open for personal portfolio use). Feel free to adapt the design and code for your own portfolio.
