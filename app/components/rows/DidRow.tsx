"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faCheck } from "@fortawesome/free-solid-svg-icons";
import type { AppConfig } from "../../../lib/config";
import type { DidCard, FilterValue, SearchHit } from "../../../lib/types";
import { buildDidCard, formatVna } from "../../../lib/api";
import { badgeList, MAX_BADGES } from "../../../lib/badges";
import { countryFlag, truncateDid } from "../../../lib/flag";

type CardState =
  | { status: "loading" }
  | { status: "ready"; card: DidCard }
  | { status: "failed" };

/** Builds the card from TG-FCT-6a snippet fields when present ([SRCH-ENR-4]). */
function cardFromSnippet(hit: SearchHit): DidCard | null {
  const s = hit.snippet;
  if (s.serviceName === undefined) return null; // pre-TG-FCT-6a graph
  return {
    serviceName: s.serviceName ?? null,
    serviceType: s.serviceType ?? null,
    serviceDescription: s.serviceDescription ?? null,
    serviceLogoUri: s.serviceLogoUri ?? null,
    operatorName: s.operatorName ?? null,
    operatorLogoUri: s.operatorLogoUri ?? null,
    operatorCountryCode: s.operatorCountryCode ?? null,
    operatorRegistryId: null, // never in the snippet; resolver-only
    operatorAddress: null,
    endpointTypes: (s.serviceEndpoints ?? []).map((e) => e.type),
    isCorporation: s.isCorporation ?? false,
    ecosystemIds: s.ecosystemIds ?? [],
    corporationId: s.corporationId ?? null,
    corporationDeposit: s.corporationDeposit ?? null,
    corporationSlashedEvents: s.corporationSlashedEvents ?? null,
    corporationLastSlashedAtTime: s.corporationLastSlashedAtTime ?? null,
    corporationSlashedValue: s.corporationSlashedValue ?? null,
  };
}

function Logo({
  uri,
  alt,
  size,
  fallback,
}: {
  uri: string | null;
  alt: string;
  size: string;
  fallback: string;
}) {
  const [broken, setBroken] = useState(false);
  if (!uri || broken) {
    return (
      <span
        aria-hidden
        className={`${size} shrink-0 rounded-lg bg-surface-2 border border-rule flex items-center justify-center display text-muted`}
      >
        {fallback}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={uri}
      alt={alt}
      className={`${size} shrink-0 rounded-lg object-cover bg-surface-2`}
      onError={() => setBroken(true)}
    />
  );
}

export default function DidRow({
  config,
  hit,
  onSetFilter,
}: {
  config: AppConfig;
  hit: SearchHit;
  onSetFilter: (key: string, value: FilterValue | null) => void;
}) {
  const did = hit.snippet.did;
  const snippetCard = cardFromSnippet(hit);
  const [state, setState] = useState<CardState>(
    snippetCard ? { status: "ready", card: snippetCard } : { status: "loading" },
  );
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // [SRCH-ENR-2]: resolver enrichment when the snippet has no card fields.
  useEffect(() => {
    if (snippetCard) return;
    let cancelled = false;
    buildDidCard(config, did, hit.snippet.lastObservedAtTime)
      .then((card) => {
        if (!cancelled) setState({ status: "ready", card });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "failed" });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [did]);

  const trusted =
    (hit.snippet.trusted ?? false) && !hit.snippet.isTrustExpired;
  const card = state.status === "ready" ? state.card : null;
  const badges = card ? badgeList(card.endpointTypes) : [];
  const shownBadges = badges.slice(0, MAX_BADGES);
  const overflow = badges.length - shownBadges.length;
  const flag = card?.operatorCountryCode
    ? countryFlag(card.operatorCountryCode)
    : null;

  function copyDid() {
    navigator.clipboard?.writeText(did).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <article className="card p-5">
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-5">
        {/* SERVICE zone */}
        <div>
          <div className="flex items-center justify-between">
            <span className="eyebrow">Service</span>
            <span className="flex items-center gap-1.5">
              {card?.isCorporation && (
                <span className="chip chip-entity">Corporation</span>
              )}
              {(card?.ecosystemIds.length ?? 0) > 0 && (
                <span
                  className="chip chip-entity"
                  title={`Controls ecosystem${(card?.ecosystemIds.length ?? 0) > 1 ? "s" : ""} ${card?.ecosystemIds.join(", ")}`}
                >
                  Ecosystem
                </span>
              )}
              <span className={`chip ${trusted ? "chip-verified" : ""}`}>
                {trusted ? "Verified" : "Untrusted"}
              </span>
            </span>
          </div>
          <div className="mt-3 flex items-start gap-3">
            <Logo
              uri={card?.serviceLogoUri ?? null}
              alt={`${card?.serviceName ?? "Service"} logo`}
              size="h-12 w-12"
              fallback={(card?.serviceName ?? did.slice(-1)).charAt(0).toUpperCase()}
            />
            <div className="min-w-0">
              {state.status === "loading" ? (
                <>
                  <div className="skeleton h-5 w-44 mb-1.5" />
                  <div className="skeleton h-3.5 w-24" />
                </>
              ) : (
                <>
                  <h3 className="display text-lg truncate">
                    {card?.serviceName ?? "Unnamed service"}
                  </h3>
                  {card?.serviceType && (
                    <p className="font-mono text-xs text-muted mt-0.5">
                      {card.serviceType}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          {state.status === "failed" ? (
            <p className="mt-2 text-sm text-muted">Details unavailable</p>
          ) : (
            card?.serviceDescription && (
              <p className="mt-2 text-sm text-muted line-clamp-2">
                {card.serviceDescription}
              </p>
            )
          )}

          {shownBadges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {shownBadges.map((b) => (
                <button
                  key={b.label}
                  type="button"
                  className="chip chip-endpoint"
                  title={`Filter by endpoint type ${b.rawType}`}
                  onClick={() =>
                    onSetFilter("Did.serviceTypes", { containsAny: [b.rawType] })
                  }
                >
                  {b.label}
                </button>
              ))}
              {overflow > 0 && (
                <span
                  className="chip chip-endpoint"
                  title={badges
                    .slice(MAX_BADGES)
                    .map((b) => b.label)
                    .join(", ")}
                >
                  +{overflow}
                </span>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className="font-mono text-xs text-muted hover:text-ink truncate"
              title={did}
              onClick={() => setShowRaw((v) => !v)}
            >
              {truncateDid(did)}
            </button>
            <button
              type="button"
              aria-label="Copy DID"
              className="text-muted hover:text-ink"
              onClick={copyDid}
            >
              <FontAwesomeIcon
                icon={copied ? faCheck : faCopy}
                className={`h-3.5 w-3.5 ${copied ? "text-success-ink" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* OPERATED BY zone */}
        <div className="md:border-l md:border-rule md:pl-5">
          <span className="eyebrow">Operated by</span>
          <div className="mt-3 flex items-start gap-3">
            <Logo
              uri={card?.operatorLogoUri ?? null}
              alt={`${card?.operatorName ?? "Operator"} logo`}
              size="h-9 w-9"
              fallback={(card?.operatorName ?? "?").charAt(0).toUpperCase()}
            />
            <div className="min-w-0">
              {state.status === "loading" ? (
                <>
                  <div className="skeleton h-4.5 w-32 mb-1.5" />
                  <div className="skeleton h-3.5 w-40" />
                </>
              ) : (
                <>
                  <p className="font-semibold truncate">
                    {flag && <span className="mr-1.5">{flag}</span>}
                    {card?.operatorName ?? "Unknown operator"}
                  </p>
                  {card?.operatorRegistryId && (
                    <p className="font-mono text-xs text-muted mt-0.5">
                      {card.operatorRegistryId}
                    </p>
                  )}
                  {card?.operatorAddress && (
                    <p className="mt-1 text-sm text-muted truncate">
                      {card.operatorAddress}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Owner-Corporation trust signals ([SRCH-ENR-2a] / [SRCH-RES-1]) */}
          {card?.corporationId != null && (
            <div className="mt-3 border-t border-rule pt-2.5 font-mono text-xs text-muted">
              <p className="eyebrow !text-[0.62rem]">
                Corporation #{card.corporationId}
              </p>
              <p className="mt-1">
                deposit {formatVna(card.corporationDeposit) ?? "n/a"}
                <span className="mx-1.5">·</span>
                <span
                  className={
                    (card.corporationSlashedEvents ?? 0) > 0
                      ? "text-[#ef4444]"
                      : ""
                  }
                >
                  slashes {card.corporationSlashedEvents ?? "n/a"}
                </span>
              </p>
              {(card.corporationSlashedEvents ?? 0) > 0 && (
                <p className="mt-0.5 text-[#ef4444]">
                  last slashed{" "}
                  {card.corporationLastSlashedAtTime
                    ? card.corporationLastSlashedAtTime.slice(0, 10)
                    : "n/a"}
                  <span className="mx-1.5">·</span>
                  slashed {formatVna(card.corporationSlashedValue) ?? "n/a"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* v1 detail: raw resolver link/drawer ([SRCH-RES-1]) */}
      {showRaw && (
        <div className="mt-4 border-t border-rule pt-3">
          <a
            className="text-sm text-accent hover:underline"
            href={`${config.resolverBaseUrl}/v4/verifiable-trust/resolve`}
            onClick={(e) => {
              e.preventDefault();
              const w = window.open("", "_blank");
              fetch(`${config.resolverBaseUrl}/v4/verifiable-trust/resolve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  did,
                  ecsCredentials: true,
                  services: true,
                  presentations: true,
                }),
              })
                .then((r) => r.json())
                .then((json) => {
                  w?.document.write(
                    `<pre>${JSON.stringify(json, null, 2).replace(/</g, "&lt;")}</pre>`,
                  );
                });
            }}
          >
            Open resolver data
          </a>
        </div>
      )}
    </article>
  );
}
