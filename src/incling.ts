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
  affinityText = "";

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
              <textarea
                class="textarea"
                placeholder="Affinity text..."
                @change=${this.updateAffinity}
              >
${this.affinityText}</textarea
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
            <p class="help">Results</p>
          </div>

          <div class="field">results here...</div>
        </div>
      </div>
    `;
  }

  updateAffinity(e: any) {
    this.affinityText = e.srcElement.value;
    console.log(e.srcElement.value);
  }

  private async _setAffinity(evt: any) {
    console.log("affinity? " + this.affinityText);

    this.loading = true;

    // note that this request is using a throw-away key
    // we know this can't be used client side
    const result = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_OAIKEY}`,
      },
      body: JSON.stringify({
        input: this.affinityText,
        model: "text-embedding-ada-002",
      }),
    });

    const jsonData = await result.json();
    this.embeddingResult = jsonData.data[0].embedding;

    console.log("did we set it?");

    console.log(this.embeddingResult);

    const outputTarget = document.getElementById("embedding-result");
    if (outputTarget)
      outputTarget.innerHTML = JSON.stringify(this.embeddingResult).replace(
        /\,/g,
        ", "
      );

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
