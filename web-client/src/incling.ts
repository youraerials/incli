import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

// import litLogo from "./assets/lit.svg";
// import viteLogo from "/vite.svg";

/**
 * An testing element for Incli.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement("incli-everything")
export class IncliEverything extends LitElement {
  /**
   * Copy for the read the docs hint.
   */
  @property()
  docsHint = "WTF man";

  /**
   * The number of times the button has been clicked.
   */
  @property({ type: Number })
  count = 0;

  @property({ type: String })
  affinityKey = "";

  @property({ type: String })
  affinityValue = "";

  @property({ type: String })
  searchText = "";

  @property({ type: Array })
  embeddingResult = [];

  @property({ type: Boolean })
  loading = false;

  render() {
    return html`
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css"
      />
      <h2>
        The idea here is to be a tiny reference widget that can do all the
        things in the "Inkling Protocol (name TBD)"
      </h2>
      <slot></slot>
      <div class="card p-4">
        <button class="button" @click=${this._onClick} part="button">
          count is ${this.count}
        </button>
      </div>
      <p class="read-the-docs">${this.docsHint}</p>

      <div class="card p-4">
        <div class="card-content">
          <div class="field">
            <label class="label">Set Affinity</label>
            <div class="control">
              <input class="input" placeholder="Affinity Key (cookie key)"
                @change=${this.updateAffinityKey} value="${this.affinityKey}" />
            </div>
            <div class="control">
              <textarea
                class="textarea"
                placeholder="Affinity value"
                @change=${this.updateAffinityValue}
              >
${this.affinityValue}</textarea
              >
            </div>
            <p class="help" style="font-size: 9px">
              This sets an affinity and vectorizes, just saving to local storage
              for now under the "incli" key, but can go anywhere (including
              ipfs, etc)!
            </p>
          </div>

          <div class="control">
            <button
              class="button is-primary ${this.loading ? "is-loading" : ""}"
              @click=${this._setAffinity}
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <div class="card p-4 mt-4">
        <div class="card-content">
          <div class="field">
            <p class="help">Search</p>
          </div>
          <div class="field">
            <label class="label">Search Affinity</label>
            <div class="control">
              <textarea
                class="textarea"
                placeholder="Search text..."
                @change=${this.updateSearch}
              >
${this.searchText}</textarea
              >
            </div>
            <p class="help" style="font-size: 9px">
              Search everything by keyphrase here
            </p>
          </div>

          <div class="control">
            <button
              class="button is-primary ${this.loading ? "is-loading" : ""}"
              @click=${this._searchAffinity}
            >
              Search
            </button>
          </div>

          <div class="field">results here...</div>
        </div>
      </div>
    `;
  }

  updateAffinityValue(e: any) {
    this.affinityValue = e.srcElement.value;
    console.log(e.srcElement.value);
  }

  updateAffinityKey(e: any) {
    this.affinityKey = e.srcElement.value;
    console.log(e.srcElement.value);
  }

  updateSearch(e: any) {
    this.searchText = e.srcElement.value;
    console.log(e.srcElement.value);
  }

  private async _searchAffinity(evt: any) {
    console.log("running search with " + this.searchText);

    this.loading = true;

    // build vector from search query
    const result = await fetch("http://127.0.0.1:8788/api/affinity/vector", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        affinityText: this.searchText,
      }),
    });

    const searchJson = await result.json();
    const searchVectors = searchJson.embeddingResult;

    // TBD fetch to local server
    // to do the pinecone thing

    const searchResult = await fetch(
      "http://127.0.0.1:8788/api/affinity/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchText: this.searchText,
          searchVectors: searchVectors,
        }),
      }
    );

    const results = await searchResult.json()

    console.log(results);

    this.loading = false;
  }

  private async _setAffinity(evt: any) {
    console.log("affinity? ", this.affinityKey, this.affinityValue);

    this.loading = true;

    // note that this request is using a throw-away key
    // we know this can't be used client side
    const result = await fetch("http://127.0.0.1:8788/api/affinity/vector", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        affinityKey: this.affinityKey,
        affinityValue: this.affinityValue,
      }),
    });

    const jsonData = await result.json();

    console.log(jsonData);

    this.embeddingResult = jsonData.embeddingResult;
    console.log("dimensions " + this.embeddingResult.length);
    console.log("did we set it for " + jsonData.text);

    console.log(this.embeddingResult.length);

    const outputTarget = document.getElementById("embedding-result");
    if (outputTarget)
      outputTarget.innerHTML = JSON.stringify(this.embeddingResult).replace(
        /\,/g,
        ", "
      );

    const setResult = await fetch("http://127.0.0.1:8788/api/affinity/set", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        affinityKey: this.affinityKey,
        affinityValue: this.affinityValue,
        vectors: this.embeddingResult,
      }),
    });

    console.log(setResult);

    alert('affinity set!');

    this.loading = false;
  }

  private _onClick() {
    this.count++;
  }

  /*
  curl https://api.openai.com/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "input": "Your text string goes here",
    "model": "text-embedding-ada-002"
  }'

  */

  static styles = css`
    :host {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "incli-everything": IncliEverything;
  }
}
