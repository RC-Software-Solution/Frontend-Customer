# Device Verification Checklist — UI Repair & Systematization

**Branch:** `feat/ui-responsive-refactor`
**Covers:** 26 commits, 18 planned tasks + 2 in-task fix rounds + 1 final fix wave
**Written for:** whoever runs the app on hardware to confirm this work

---

## Why this file exists

Every task in this refactor was verified two ways: a per-file TypeScript check, and a
code-level review against its stated criteria. **Neither of those is a device.** No
emulator or phone was available during implementation.

So "complete" on this branch means **implemented and statically verified** — not
*confirmed correct on a screen*. Some criteria were genuinely proven from source (those
are listed at the bottom, and need no check). The rest are below, and they need eyes.

## Two profiles are required

| Profile | Why |
|---|---|
| Your physical Android (~412dp) | Regression check — nothing that worked should break |
| An emulator at **320×640** | Where nearly every bug in the original audit actually appears |

The narrow profile is not optional. Most findings here do not reproduce at 412dp; that
is precisely why they shipped in the first place.

---

## Priority checks — highest risk first

- [ ] **Welcome-intro heading clears the status bar.** A Critical found in final review: the
      plan cut this screen's top margin from 90 to 32 with no inset, which put the heading
      behind the notch on every iOS device. Fixed — but this is the one that escaped every
      earlier check *because* it only shows on a device with a large top inset. Check on
      iOS or a tall-notch Android, not just your dev phone.

- [ ] **Profile: "Delete Account" is reachable.** Before this branch it was entirely
      off-screen below ~700dp height. Scroll to the bottom at **320×640** and confirm both
      Logout and Delete Account are reachable.

- [ ] **Both confirm dialogs read correctly.** The modal is shared by *Cancel Order* and
      *Delete Account*, and its colours were backwards (destructive grey, safe green).
      Confirm in **both**: destructive action red, safe action neutral grey. This is the one
      change where being wrong costs a user their account.

- [ ] **Signup / login / verify submit buttons are reachable.** At **320×640**, with all
      validation errors showing. This was the `flex: 1`-kills-the-ScrollView bug.

- [ ] **"Breakfast" tab label at 320dp**, including with a **large accessibility font
      scale**. The original audit said "Dinner is clipped" — that was wrong. Arithmetic
      showed Dinner fits and *Breakfast* is the tight one. Labels now shrink instead of
      truncating; whether `minimumFontScale: 0.85` is enough at the worst combination is
      not provable from source.

- [ ] **Cart order total at 320dp — known residual.** The overflow is fixed (nothing renders
      outside the row), but content is ~315dp in ~256dp, so the longer label may show an
      **ellipsis**. See "Open decision" below.

---

## Layout checks

- [ ] Onboarding decorative shapes do not overlap the description text. Box math suggests
      `titleTextShape2` may overlap by ~9dp, but real impact depends on transparent padding
      inside `title2.png`. **If it clips:** change `bottom: -14` to about `-4` in
      `styles/onboarding/onboarding.tsx`.
- [ ] Onboarding "Get Started" label is not vertically clipped.
- [ ] Welcome-intro slides fit at 320×640 (arithmetic says ~220dp slack — high confidence).
- [ ] Pagination dots and the Next/Done button do not overlap.
- [ ] Logo is not stretched on either profile.
- [ ] Focused tab icon is vertically centred in the green pill. The `0→4` interpolation in
      `components/tabBarButton.tsx/tabBarButton.tsx` is a **tuned number with no geometric
      derivation** — adjust if it looks off.
- [ ] Tab bar clears the gesture bar / home indicator. Clearance dropped from a fixed 30dp
      to `insets.bottom + 12`; confirm that reads well.
- [ ] Last list item is fully visible above the tab bar on **all five** tabs.
- [ ] "RC Caterings" heading gap looks the same on both profiles.
- [ ] Notification message wraps inside its card at 320dp.
- [ ] Pending-payments ID / date / price all fit at 320dp.
- [ ] Edit Order modal fits at 320×640 with Close and Save visible (math says yes).
- [ ] Edit Order: "Remove" is reachable with a long dish name.
- [ ] Verify screen: 4 code boxes fit at 320dp and are centred at 412dp.
- [ ] Each password eye toggle sits inside its **own** field on sign-up-second, including
      after an error appears. **Behaviour change:** the two fields now toggle
      *independently*, where one shared flag previously flipped both.
- [ ] No input hidden behind the keyboard on any auth screen.
- [ ] Avatar is a clean circle with its shadow visible on **both** platforms. "Renders on
      both" is proven; visual parity between Android `elevation` and iOS `CALayer` shadow
      is not.
- [ ] Cart back button clears the status bar. **Worth one deliberate look:** this is the
      only place correctness rests on a Yoga version (RN 0.86.3 + new architecture uses
      Yoga 3's padding-box containing block) rather than on arithmetic.

## Cosmetic

- [ ] Card density: gaps went 20dp → 8dp and shadows 0.25 → 0.15 opacity across list
      screens. Consistent by design, but a visible change.
- [ ] Heading sizes on a large phone. Removing the responsive libraries made some text
      fixed-size; headings compress 27dp → 20dp at the tall end. (At the short end this was
      a clear improvement — some text was previously ~11dp.)

---

## Open decision — not a defect

**Cart summary may ellipsize at 320dp.** Content needs ~315dp; 256dp is available. The
overflow bug is fixed and nothing renders outside the container, but the longer of the two
labels can show a trailing ellipsis on the narrowest phones.

The smallest fix, if you want the full total always visible: change `summary` in
`screens/cart/cart.screen.tsx` from `flexDirection: 'row'` to `'column'` and drop
`justifyContent: 'space-between'`. Each line then gets the full ~256dp and both fit with no
shrink. It is one style-object change and touches no text.

This was left undone deliberately — it changes the cart's visual layout, which is a design
call rather than a defect repair.

---

## Proven from source — no device needed

These were settled by reading code or arithmetic, and do not need checking:

- No nested VirtualizedLists anywhere (zero `FlatList`/`SectionList`/`VirtualizedList`
  remain in `home.screen.tsx`).
- Tab bar left/right gaps are equal at any width 320–930dp (geometric, from `left`/`right`
  anchoring with no `width`).
- The tab pill does not slide in on cold launch (it is not rendered until measured, and
  that first render already carries the correct position).
- No invalid colour values remain (`#oaoaoa`, `#25123EC`) — grep-gated.
- Both responsive libraries are gone from source and `package.json` — grep-gated.
- No `marginHorizontal: 15` survives against `space.md` siblings — grep-gated.
- All business logic is byte-identical: auth handlers, `menuService`/`orderService`/
  `authService` calls, redux dispatches, focus effects.
- The build holds at 21 pre-existing errors in two out-of-scope `services/` files, with
  zero errors in any file this branch touched.
