# Build your first AI agent on Azure

Sample files for the video **"Build your first AI agent on Azure"**. They let you build
**Penny**, an AI assistant for a fictional bakery, Blue Penguin Bakery, in Microsoft Foundry.

Penny can:

- answer questions from the bakery's documents (File search)
- analyse a sales spreadsheet and draw charts (Code interpreter)
- check the status of an order by calling the bakery's own API (OpenAPI tool)
- refuse jailbreak attempts (guardrails), with every step visible in traces

## What is in this folder

| Folder | Contents | Used in the video for |
|---|---|---|
| [`agent/instructions.txt`](agent/instructions.txt) | Penny's instructions | Creating the agent |
| [`data/bakery-docs/`](data/bakery-docs) | Six short bakery documents (returns, opening hours, delivery, allergies, menu, custom cakes) | Knowledge: *Upload files* |
| [`data/september-sales.csv`](data/september-sales.csv) | One row per product per opening day in September | Code interpreter: *Files* |
| [`function/`](function) | The `OrderStatus` Azure Function (JavaScript), with its `function.json` and `host.json` | The order API |
| [`openapi/bakery-orders.json`](openapi/bakery-orders.json) | OpenAPI 3.0 description of the order API | Adding the API as a tool |
| [`website/`](website) | A small bakery website with an "Ask Penny" chat that calls the agent (`server.js`, `index.html`, `package.json`) | Your agent on your own website |

## What you need

- An Azure subscription where you can create resources
- Permission to use Microsoft Foundry (the **Azure AI User** role or higher on the Foundry resource)
- Node.js 20 or later, and the Azure CLI, only if you want to run the website locally

Following along costs very little, as long as you delete the resource group at the end.

## Step by step

1. **Create the resources** in the Azure portal: a resource group, and a Microsoft Foundry
   resource (it creates a first project for you).
2. **Deploy a model** in the Foundry portal. The video uses `gpt-4.1-mini` with the default settings.
3. **Create the agent**: *Build > Agents > New agent > Build an agent*. Paste
   [`agent/instructions.txt`](agent/instructions.txt) into *Instructions*, remove the default
   *Web search* tool, and save.
4. **Add knowledge**: *Tools > Upload files*, create a vector index, and upload the files in
   [`data/bakery-docs/`](data/bakery-docs).
5. **Add the code interpreter**: *Tools > Add > Code interpreter*, then *Files* and upload
   [`data/september-sales.csv`](data/september-sales.csv).
6. **Create the order API**: create a Function App (Consumption plan, Node.js), add an HTTP-triggered
   function named `OrderStatus`, and replace its code with
   [`function/OrderStatus/index.js`](function/OrderStatus/index.js).
   Test it with `GET /api/OrderStatus?orderId=BP-1042`.
7. **Add the API as a tool**: *Tools > Add > Add tools > Custom > OpenAPI tool*. Paste
   [`openapi/bakery-orders.json`](openapi/bakery-orders.json) and replace `<your-function-app>`
   in `servers.url` with your Function App's address (its *Default domain*).
8. **Try it**: ask *"Where is my order BP-1042?"*, *"Can I return a cake for cash?"* and
   *"Which product earned the most money in September? Draw a bar chart."*

## Run the website locally

```bash
cd website
npm install
az login
export PROJECT_ENDPOINT="https://<foundry-resource>.services.ai.azure.com/api/projects/<project>"
export AGENT_NAME="penny"
npm start
```

Open http://localhost:3000 and click **Ask Penny**. The project endpoint is shown on the
project's home page in the Foundry portal. The server signs in with Microsoft Entra ID through
`DefaultAzureCredential`, so no API key is needed. *How it works* shows the request the website
sends and the steps Penny took.

## Before you use this for real

- The order API uses **anonymous** access to keep the demo simple. Protect a real API with a
  function key or Microsoft Entra ID, and use the matching authentication in the OpenAPI tool.
- The orders are hard-coded in the function. A real API would read them from a database.
- Delete the resource group when you are done, so nothing keeps running.

## Next

This sample uses **File search**, which is the quickest way to give an agent a handful of
documents. The next video connects an agent to **Azure AI Search**, for large document
collections that keep changing.
