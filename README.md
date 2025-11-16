# 🦁 WesBI Beast Mode - FBA Intelligence Cockpit

An advanced FBA intelligence cockpit for real-time Amazon operations analytics. This tool empowers Amazon FBA sellers to transform raw inventory snapshot CSVs into a strategic command center. Analyze inventory health, sales performance, and potential risks with a powerful dashboard, and leverage AI-powered insights to make smarter, data-driven decisions that boost profitability.

---

## ✨ Key Features

*   **📊 Interactive Dashboard:** Get a high-level overview of your entire FBA operation with key metrics like total inventory value, sell-through rate, average inventory age, and at-risk SKUs.
*   **🧠 AI-Powered Insights (Gemini):** Automatically generate concise, actionable business insights from your data. The system analyzes your inventory summary and provides recommendations to increase profit, reduce fees, and improve overall inventory health.
*   **📈 Rich Data Visualization:**
    *   **Inventory Age Distribution:** Instantly see how much of your stock is aging and identify potential long-term storage fee risks.
    *   **Top At-Risk SKUs:** A bar chart highlighting products with the highest risk scores, helping you prioritize action.
    *   **Sell-Through Performance:** Identify your fastest-moving products to inform restocking and marketing decisions.
*   **🔄 Snapshot Comparison Mode:** Upload two different snapshot files and activate "Comparison Mode" to track trends and changes over time. See deltas for inventory levels, sales velocity, and risk scores on a per-SKU basis.
*   **📁 Multi-File Processing:** Upload and process multiple FBA snapshot CSVs at once. The system intelligently merges the data, allowing for a consolidated view of your inventory.
*   **🚀 Powerful Data Table:**
    *   **Advanced Filtering:** Drill down into your data by SKU, ASIN, product name, inventory age, stock status, and recommended action.
    *   **Dynamic Sorting:** Sort your entire dataset by any metric to quickly find what you need.
    *   **Conditional Highlighting:** Rows are automatically color-coded based on risk score, sales velocity, and recommended actions, drawing your attention to the most critical items.
*   **📱 Fully Responsive:** The entire interface is designed to work seamlessly on desktop, tablet, and mobile devices.

## 🛠️ Technology Stack

This project is built as a modern, self-contained single-page application, leveraging a powerful stack for optimal performance and user experience.

*   **Frontend:**
    *   **React:** For building a dynamic and component-based user interface.
    *   **TypeScript:** For robust, type-safe code that is easier to maintain and scale.
    *   **Tailwind CSS:** For rapid, utility-first styling and a clean, modern design.
*   **Artificial Intelligence:**
    *   **Google Gemini API (`@google/genai`):** Powers the "AI-Powered Insights" feature, providing sophisticated analysis of inventory data.
*   **Data Handling & Visualization:**
    *   **PapaParse:** A high-performance, in-browser CSV parser to handle the FBA snapshot files.
    *   **Recharts:** A composable charting library built on React components for creating beautiful and interactive data visualizations.

## ⚙️ How to Use

1.  **Launch the Application:** Open the `index.html` file in your web browser.
2.  **Upload Your Data:**
    *   Click the **"Choose Files"** button and select one or more of your FBA Inventory Snapshot `.csv` files.
    *   Click the **"Process"** button.
3.  **Analyze Your Dashboard:**
    *   The dashboard will load with summary statistics, AI-generated insights, and interactive charts.
    *   Scroll down to the data table to see a detailed breakdown of every SKU.
4.  **Filter and Sort:**
    *   Use the search bar and filter dropdowns to narrow down your data.
    *   Click on any column header in the data table to sort the data.
5.  **Compare Snapshots:**
    *   Upload a second (newer) snapshot file.
    *   Click the **"Compare"** button. The dashboard and data table will now show the changes between the two most recent snapshots.
    *   Click **"Exit Comparison"** to return to the single snapshot view.

---

This tool was designed to be a force multiplier for FBA sellers, turning complex data into a clear strategic advantage. Go Beast Mode on your data!
