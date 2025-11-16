# WesBI - FBA Intelligence Cockpit

An advanced FBA intelligence cockpit for real-time Amazon operations analytics. This tool empowers Amazon FBA sellers to transform raw inventory snapshot CSVs into a strategic command center. Analyze inventory health, sales performance, and potential risks with a powerful dashboard, and leverage AI-powered insights to make smarter, data-driven decisions that boost profitability.

---

## ✨ Key Features

*   **Interactive Dashboard:** Get a high-level overview of your entire FBA operation with key metrics like Total Products, Available Inventory, Pending Removals, Sell-Through Rate, Average Inventory Age, and At-Risk SKUs.
*   **AI-Powered Insights (Gemini):** Automatically generate concise, actionable business insights from your data. The system analyzes your inventory summary and provides recommendations to increase profit, reduce fees, and improve overall inventory health.
*   **AI Strategy Session (Gemini):** Go beyond insights and generate a complete, step-by-step operational playbook. Select a high-level business goal (e.g., 'Liquidate High-Risk Inventory'), and the AI will analyze your current data to create a detailed, actionable plan to achieve your objective.
*   **Snapshot Comparison Mode:** Upload two different snapshot files and activate "Comparison Mode" to track trends and changes over time. See per-SKU deltas for inventory levels, sales velocity, and risk scores directly within the data table and summary cards.
*   **Restock Forecasting:** Proactively manage your inventory with calculated restock recommendations for each SKU. Fine-tune the forecast by adjusting key parameters like Supplier Lead Time, Safety Stock days, and overall Demand Forecast percentage.
*   **Rich Data Visualization:**
    *   **Inventory Age Distribution:** Instantly see how much of your stock is aging and identify potential long-term storage fee risks.
    *   **Top At-Risk SKUs:** A bar chart highlighting products with the highest risk scores, helping you prioritize action.
    *   **Sell-Through Performance:** Identify your fastest-moving products to inform restocking and marketing decisions.
*   **Advanced Data Table:**
    *   **Powerful Filtering & Search:** Instantly search by SKU, ASIN, or Product Name. Drill down into your data with comprehensive filters for Inventory Age, Recommended Action, Stock Status (Low, High, Stranded), and Min/Max Stock levels.
    *   **Dynamic Sorting:** Sort your entire dataset by any metric to quickly find what you need.
    *   **Conditional Highlighting:** Rows are automatically color-coded based on risk score, sales velocity, and recommended actions, drawing your attention to the most critical items.
    *   **Customizable Pagination:** Adjust the number of rows displayed per page (30, 50, 100, or 250) for flexible data analysis.
*   **Multi-File Processing & Export:** Upload and process multiple FBA snapshot CSVs at once for a consolidated view. Export your current filtered and sorted data to a new CSV file with a single click.
*   **State Persistence:** Your user settings—including filters, sort preferences, forecast configurations, and items per page—are automatically saved in your browser, providing a seamless experience across sessions.
*   **Fully Responsive:** The entire interface is designed to work seamlessly on desktop, tablet, and mobile devices.

## 🛠️ Technology Stack

This project is built as a modern, self-contained single-page application, leveraging a powerful stack for optimal performance and user experience.

*   **Frontend:**
    *   **React:** For building a dynamic and component-based user interface.
    *   **TypeScript:** For robust, type-safe code that is easier to maintain and scale.
    *   **Tailwind CSS:** For rapid, utility-first styling and a clean, modern design.
*   **Artificial Intelligence:**
    *   **Google Gemini API (`@google/genai`):** Powers the "AI-Powered Insights" and "AI Strategy Session" features, providing sophisticated analysis of inventory data.
*   **Data Handling & Visualization:**
    *   **PapaParse:** A high-performance, in-browser CSV parser used to efficiently process FBA snapshot files directly in the browser.
    *   **Recharts:** A composable charting library built on React components for creating beautiful and interactive data visualizations.

## ⚙️ How to Use

1.  **Launch the Application:** Open the application in your web browser.
2.  **Get Help:** For a detailed walkthrough of all features, click the **(?)** icon in the top-right corner of the header to open the in-app **User Guide**.
3.  **Upload Your Data:**
    *   Click the **"Upload & Process"** button and select one or more of your FBA Inventory Snapshot `.csv` files.
    *   The application will automatically parse the files, calculate metrics, and generate AI insights.
4.  **Analyze Your Dashboard:**
    *   The dashboard will load with summary statistics, AI-generated insights, and interactive charts.
    *   Scroll down to the data table to see a detailed breakdown of every SKU.
5.  **Generate an AI Strategy:**
    *   Click the **"AI Strategy Session"** button.
    *   Select a high-level business goal (e.g., "Liquidate High-Risk Inventory").
    *   Click **"Generate Plan"** to receive a detailed, step-by-step action plan tailored to your current data.
6.  **Filter, Sort, and Forecast:**
    *   Use the search bar and filter dropdowns to narrow down your data.
    *   Click on any column header in the data table to sort the data.
    *   Adjust the **Restock Forecast Settings** to get tailored reordering recommendations.
7.  **Compare Snapshots:**
    *   Ensure at least two snapshots are loaded.
    *   Click the **"Compare..."** button. A modal will appear.
    *   Select your "Base" (older) and "Compare" (newer) snapshots and confirm.
    *   The dashboard and data table will now show the changes between the two snapshots.
    *   Click **"Exit Comparison"** to return to the single snapshot view.
8.  **Export Data:**
    *   Click the **"Export"** button at any time to download the current data view (including all filters and sorting) as a new CSV file.

---

This tool was designed to be a force multiplier for FBA sellers, turning complex data into a clear strategic advantage. Unlock your data's full potential.