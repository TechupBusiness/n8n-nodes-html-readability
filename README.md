![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-html-readability

This is an n8n community node. It lets you use Mozilla's Readability in your n8n workflows.

Mozilla's Readability is a standalone version of the algorithm used by Firefox Reader View to extract the main content from web pages, removing clutter and providing clean, readable text.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

### HTML

#### Extract Content

Extracts the main content from HTML, removing navigation, ads, and other distracting elements.

**Options:**

| Parameter | Type | Description |
|:--------:|:----:|:------------|
| JSON Property | String | The property containing the HTML content to parse. Supports both dot notation (e.g., 'solution.response') and expressions |
| Continue on Error | Boolean | Whether to continue execution when the node encounters an error |
| Return Full Response | Boolean | Whether to return the full Readability response including metadata |

**Output:**

Default output includes:
```json
{
  "content": "<div>...extracted HTML content...</div>",
  "title": "Article Title",
  "excerpt": "Brief excerpt of the content"
}
```

With "Return Full Response" enabled, additional fields are included:
```json
{
  "content": "<div>...extracted HTML content...</div>",
  "title": "Article Title",
  "excerpt": "Brief excerpt of the content",
  "length": 12345,
  "byline": "Author Name",
  "dir": "ltr",
  "siteName": "Website Name",
  "textContent": "Plain text version of the content"
}
```

## Compatibility

- Requires n8n version 1.0.0 or later
- Uses Mozilla's Readability v0.6.0
- Node.js v18.10 or later

## Usage

1. Add the Readability node to your workflow
2. Connect it to a node that provides HTML content (e.g., HTTP Request)
3. Specify the JSON property containing the HTML (e.g., 'data' or 'response.body')
4. Optionally enable "Return Full Response" for additional metadata
5. Run the workflow to extract clean, readable content

### Example Usage

This example shows how to extract readable content from a webpage:

1. HTTP Request node: Fetch a webpage
2. Readability node:
   - Set "JSON Property" to "data"
   - Enable "Return Full Response" if you need metadata
3. The node will output clean HTML content and metadata

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [Mozilla Readability Documentation](https://github.com/mozilla/readability)
* [Firefox Reader View Blog Post](https://firefox-source-docs.mozilla.org/toolkit/components/reader/)

## License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)
