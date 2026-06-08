/* @ds-bundle: {"format":3,"namespace":"CalComDesignSystem_436c9d","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"IconButton","sourcePath":"components/buttons/IconButton.jsx"},{"name":"Avatar","sourcePath":"components/data-display/Avatar.jsx"},{"name":"AvatarStack","sourcePath":"components/data-display/Avatar.jsx"},{"name":"Badge","sourcePath":"components/data-display/Badge.jsx"},{"name":"Card","sourcePath":"components/data-display/Card.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"NavPillGroup","sourcePath":"components/navigation/NavPillGroup.jsx"}],"sourceHashes":{"components/buttons/Button.jsx":"43d6596187fb","components/buttons/IconButton.jsx":"aff58e362322","components/data-display/Avatar.jsx":"22db870aa4d7","components/data-display/Badge.jsx":"63b66263fd87","components/data-display/Card.jsx":"18461f0d7a07","components/forms/Input.jsx":"9b98fc5b3a34","components/forms/Switch.jsx":"6655aec40b8d","components/navigation/NavPillGroup.jsx":"60ae2f923b6f"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.CalComDesignSystem_436c9d = window.CalComDesignSystem_436c9d || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Cal.com primary/secondary/ghost button.
 * Near-black primary CTA, hairline-outline secondary, transparent ghost.
 * Renders as <a> when `href` is set (Cal.com styles links as buttons).
 */
function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  disabled = false,
  iconLeft,
  iconRight,
  fullWidth = false,
  style,
  ...rest
}) {
  const heights = {
    sm: 32,
    md: 40,
    lg: 48
  };
  const padX = {
    sm: 14,
    md: 20,
    lg: 24
  };
  const fontSize = {
    sm: 13,
    md: 14,
    lg: 15
  };
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--space-xs)",
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    fontSize: fontSize[size],
    lineHeight: 1,
    height: heights[size],
    padding: `0 ${padX[size]}px`,
    borderRadius: "var(--radius-md)",
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    textDecoration: "none",
    width: fullWidth ? "100%" : "auto",
    whiteSpace: "nowrap",
    transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)",
    userSelect: "none"
  };
  const variants = {
    primary: {
      background: disabled ? "var(--cal-primary-disabled)" : "var(--cal-primary)",
      color: disabled ? "var(--cal-muted)" : "var(--cal-on-primary)"
    },
    secondary: {
      background: "var(--cal-canvas)",
      color: disabled ? "var(--cal-muted)" : "var(--cal-ink)",
      borderColor: "var(--cal-hairline)"
    },
    ghost: {
      background: "transparent",
      color: disabled ? "var(--cal-muted)" : "var(--cal-ink)"
    },
    invert: {
      background: "var(--cal-canvas)",
      color: "var(--cal-ink)"
    }
  };
  const onDown = e => {
    if (disabled) return;
    if (variant === "primary") e.currentTarget.style.background = "var(--cal-primary-active)";
    if (variant === "secondary" || variant === "ghost") e.currentTarget.style.background = "var(--cal-surface-card)";
  };
  const onUp = e => {
    if (disabled) return;
    e.currentTarget.style.background = variants[variant].background;
  };
  const Tag = href && !disabled ? "a" : "button";
  return /*#__PURE__*/React.createElement(Tag, _extends({
    href: href && !disabled ? href : undefined,
    disabled: Tag === "button" ? disabled : undefined,
    "aria-disabled": disabled || undefined,
    style: {
      ...base,
      ...variants[variant],
      ...style
    },
    onMouseDown: onDown,
    onMouseUp: onUp,
    onMouseLeave: onUp
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/buttons/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Circular 36px icon button — hairline outline on white.
 * Used for share, carousel arrows, "more". Pass a single icon node as children.
 */
function IconButton({
  children,
  size = 36,
  variant = "secondary",
  href,
  ariaLabel,
  style,
  ...rest
}) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: size,
    height: size,
    borderRadius: "var(--radius-full)",
    border: "1px solid transparent",
    cursor: "pointer",
    color: "var(--cal-ink)",
    background: "var(--cal-canvas)",
    transition: "background var(--dur-fast) var(--ease-standard)",
    padding: 0
  };
  const variants = {
    secondary: {
      background: "var(--cal-canvas)",
      borderColor: "var(--cal-hairline)"
    },
    ghost: {
      background: "transparent"
    },
    solid: {
      background: "var(--cal-primary)",
      color: "var(--cal-on-primary)"
    }
  };
  const Tag = href ? "a" : "button";
  return /*#__PURE__*/React.createElement(Tag, _extends({
    href: href,
    "aria-label": ariaLabel,
    style: {
      ...base,
      ...variants[variant],
      ...style
    },
    onMouseEnter: e => {
      if (variant !== "solid") e.currentTarget.style.background = "var(--cal-surface-card)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = variants[variant].background;
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const FILLS = ["orange", "pink", "violet", "emerald"];
const FILL_VARS = {
  orange: "var(--cal-badge-orange)",
  pink: "var(--cal-badge-pink)",
  violet: "var(--cal-badge-violet)",
  emerald: "var(--cal-badge-emerald)"
};
function pick(seed) {
  let h = 0;
  for (let i = 0; i < (seed || "").length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  return FILLS[h % FILLS.length];
}

/**
 * Circular avatar — photo (`src`) or pastel fill with initials.
 * Default 36px. Fill color is derived from the name unless `color` is given.
 */
function Avatar({
  src,
  name = "",
  size = 36,
  color,
  style
}) {
  const initials = name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const fill = FILL_VARS[color || pick(name)];
  const base = {
    width: size,
    height: size,
    borderRadius: "var(--radius-full)",
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...style
  };
  if (src) {
    return /*#__PURE__*/React.createElement("img", {
      src: src,
      alt: name,
      style: {
        ...base,
        objectFit: "cover"
      }
    });
  }
  return /*#__PURE__*/React.createElement("span", {
    style: {
      ...base,
      background: fill,
      color: "#fff",
      fontFamily: "var(--font-sans)",
      fontWeight: 600,
      fontSize: Math.round(size * 0.4)
    }
  }, initials || "?");
}

/**
 * Overlapping stack of avatars with an optional "+N" overflow chip.
 */
function AvatarStack({
  people = [],
  max = 4,
  size = 36
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center"
    }
  }, shown.map((p, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      marginLeft: i === 0 ? 0 : -size * 0.32,
      border: "2px solid var(--cal-canvas)",
      borderRadius: "var(--radius-full)",
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement(Avatar, _extends({}, p, {
    size: size
  })))), extra > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: -size * 0.32,
      border: "2px solid var(--cal-canvas)",
      width: size,
      height: size,
      borderRadius: "var(--radius-full)",
      background: "var(--cal-surface-strong)",
      color: "var(--cal-ink)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-sans)",
      fontWeight: 600,
      fontSize: Math.round(size * 0.34)
    }
  }, "+", extra));
}
Object.assign(__ds_scope, { Avatar, AvatarStack });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Badge.jsx
try { (() => {
const PASTELS = {
  gray: {
    bg: "var(--cal-surface-card)",
    fg: "var(--cal-ink)"
  },
  orange: {
    bg: "var(--cal-badge-orange)",
    fg: "#fff"
  },
  pink: {
    bg: "var(--cal-badge-pink)",
    fg: "#fff"
  },
  violet: {
    bg: "var(--cal-badge-violet)",
    fg: "#fff"
  },
  emerald: {
    bg: "var(--cal-badge-emerald)",
    fg: "#0a3a28"
  },
  success: {
    bg: "rgba(16,185,129,0.12)",
    fg: "#0a7c5a"
  },
  warning: {
    bg: "rgba(245,158,11,0.14)",
    fg: "#9a6200"
  },
  error: {
    bg: "rgba(239,68,68,0.12)",
    fg: "#b42318"
  }
};

/**
 * Pill badge / tag — category labels and small status chips.
 * Default is the neutral gray pill; pastel + semantic colors available.
 */
function Badge({
  children,
  color = "gray",
  dot = false,
  style
}) {
  const c = PASTELS[color] || PASTELS.gray;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: c.bg,
      color: c.fg,
      fontFamily: "var(--font-sans)",
      fontSize: "var(--caption-size)",
      fontWeight: 500,
      lineHeight: 1,
      padding: "5px 12px",
      borderRadius: "var(--radius-pill)",
      whiteSpace: "nowrap",
      ...style
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "currentColor"
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Card.jsx
try { (() => {
/**
 * Cal.com content card. Two deliberate modes:
 *  - variant="feature": light-gray surface, no border (abstract claim)
 *  - variant="product": white surface + hairline + soft shadow (shows real product chrome)
 *  - variant="dark": the scarce dark surface (featured tier)
 */
function Card({
  children,
  variant = "feature",
  padding = "lg",
  radius = "lg",
  style
}) {
  const pad = {
    sm: "var(--space-md)",
    md: "var(--space-lg)",
    lg: "var(--space-xl)"
  }[padding] || padding;
  const rad = {
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)"
  }[radius] || radius;
  const variants = {
    feature: {
      background: "var(--cal-surface-card)",
      border: "1px solid transparent",
      color: "var(--cal-ink)",
      boxShadow: "none"
    },
    plain: {
      background: "var(--cal-canvas)",
      border: "1px solid var(--cal-hairline)",
      color: "var(--cal-ink)",
      boxShadow: "none"
    },
    product: {
      background: "var(--cal-canvas)",
      border: "1px solid var(--cal-hairline)",
      color: "var(--cal-ink)",
      boxShadow: "var(--shadow-md)"
    },
    dark: {
      background: "var(--cal-surface-dark)",
      border: "1px solid transparent",
      color: "var(--cal-on-dark)",
      boxShadow: "none"
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: rad,
      padding: pad,
      fontFamily: "var(--font-sans)",
      ...variants[variant],
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Card.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Cal.com text input — hairline border, 8px radius, 40px tall.
 * Border darkens to ink on focus. Supports an optional leading icon and label.
 */
function Input({
  label,
  hint,
  error,
  iconLeft,
  size = "md",
  style,
  id,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const reactId = React.useId();
  const inputId = id || reactId;
  const height = size === "sm" ? 34 : 40;
  const wrap = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-xs)",
    height,
    padding: "0 14px",
    background: "var(--cal-canvas)",
    border: `1px solid ${error ? "var(--cal-error)" : focused ? "var(--cal-ink)" : "var(--cal-hairline)"}`,
    borderRadius: "var(--radius-md)",
    transition: "border-color var(--dur-fast) var(--ease-standard)",
    boxShadow: focused && !error ? "0 0 0 3px rgba(17,17,17,0.06)" : "none"
  };
  const input = {
    border: "none",
    outline: "none",
    background: "transparent",
    flex: 1,
    fontFamily: "var(--font-sans)",
    fontSize: "var(--body-md-size)",
    color: "var(--cal-ink)",
    minWidth: 0,
    height: "100%"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 14,
      fontWeight: 600,
      color: "var(--cal-ink)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: wrap
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      color: "var(--cal-muted)"
    }
  }, iconLeft), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    style: input,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false)
  }, rest))), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      color: error ? "var(--cal-error)" : "var(--cal-muted)"
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/**
 * Toggle switch — near-black track when on, hairline track when off.
 * Controlled (`checked` + `onChange`) or uncontrolled (`defaultChecked`).
 */
function Switch({
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  ariaLabel,
  style
}) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(defaultChecked);
  const on = isControlled ? checked : internal;
  const toggle = () => {
    if (disabled) return;
    if (!isControlled) setInternal(!on);
    onChange && onChange(!on);
  };
  return /*#__PURE__*/React.createElement("button", {
    role: "switch",
    "aria-checked": on,
    "aria-label": ariaLabel,
    onClick: toggle,
    disabled: disabled,
    style: {
      width: 40,
      height: 24,
      borderRadius: "var(--radius-pill)",
      border: "none",
      padding: 2,
      cursor: disabled ? "not-allowed" : "pointer",
      background: on ? "var(--cal-primary)" : "var(--cal-surface-strong)",
      opacity: disabled ? 0.5 : 1,
      transition: "background var(--dur-base) var(--ease-standard)",
      display: "inline-flex",
      alignItems: "center",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      borderRadius: "var(--radius-full)",
      background: "var(--cal-canvas)",
      boxShadow: "var(--shadow-xs)",
      transform: on ? "translateX(16px)" : "translateX(0)",
      transition: "transform var(--dur-base) var(--ease-standard)"
    }
  }));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavPillGroup.jsx
try { (() => {
/**
 * Cal.com's signature nav-pill-group — a pill-radius wrapper around 2–3
 * segments. The active segment renders as a white pill with a subtle inner
 * shadow inside the soft-gray track. Controlled or uncontrolled.
 */
function NavPillGroup({
  items = [],
  value,
  defaultValue,
  onChange,
  style
}) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue ?? (items[0] && items[0].value));
  const active = isControlled ? value : internal;
  const select = v => {
    if (!isControlled) setInternal(v);
    onChange && onChange(v);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      gap: 2,
      padding: 4,
      background: "var(--cal-surface-soft)",
      borderRadius: "var(--radius-pill)",
      ...style
    }
  }, items.map(it => {
    const on = it.value === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      onClick: () => select(it.value),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        border: "none",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--nav-link-size)",
        fontWeight: 500,
        padding: "8px 16px",
        borderRadius: "var(--radius-pill)",
        background: on ? "var(--cal-canvas)" : "transparent",
        color: on ? "var(--cal-ink)" : "var(--cal-muted)",
        boxShadow: on ? "var(--shadow-pill-active)" : "none",
        transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)"
      }
    }, it.icon, it.label);
  }));
}
Object.assign(__ds_scope, { NavPillGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavPillGroup.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.AvatarStack = __ds_scope.AvatarStack;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.NavPillGroup = __ds_scope.NavPillGroup;

})();
