# 컨벤션

## 도구

- 린트는 oxlint, 포맷은 oxfmt입니다. ESLint와 Prettier는 쓰지 않습니다. 설정은 `.oxlintrc.json`, `.oxfmtrc.jsonc`입니다.
- 커밋 전 `pnpm format`, `pnpm lint`, `pnpm typecheck`를 통과시킵니다.
- 의존성은 반드시 `pnpm add`/`pnpm remove`로 바꿉니다. `package.json`을 직접 편집하지 않습니다.

### 꺼둔 린트 규칙

| 규칙                                         | 이유                                           |
| -------------------------------------------- | ---------------------------------------------- |
| `react/react-in-jsx-scope`                   | 자동 JSX 런타임이라 `React` import가 필요 없음 |
| `jsx-a11y/media-has-caption`                 | 녹음 재생용 `<audio>`에 자막 트랙이 없음       |
| `import/no-unassigned-import` (`*.css` 허용) | `globals.css` 사이드이펙트 import              |

## 코드 스타일

- 소스 코드에 주석을 쓰지 않습니다. 설명이 필요하면 이름을 바꾸거나 이 문서에 적습니다. `src/components/ui`는 shadcn이 생성한 파일이라 예외이며, 나중에 CLI로 갱신할 수 있도록 손대지 않습니다. 단 `src/hooks/use-mobile.ts`는 이 저장소의 `react/set-state-in-effect` 규칙에 맞춰 `useSyncExternalStore`로 다시 썼습니다.
- UI 문구와 서버가 만드는 오류 메시지는 한국어로 씁니다. 로그와 식별자는 영어입니다.
- 아이콘은 `lucide-react`만 씁니다. 장식용 아이콘에는 `aria-hidden`을 붙입니다.
- 색상은 Tailwind zinc 팔레트를 기본으로 하고 `dark:` 변형을 항상 함께 둡니다. shadcn 컴포넌트는 `globals.css`의 시맨틱 토큰(`background`, `muted`, `sidebar` 등)을 씁니다.
- 다크 모드는 `prefers-color-scheme`만 따릅니다. shadcn 기본값인 `.dark` 클래스 방식은 쓰지 않으며, 토큰의 다크 값도 `@media (prefers-color-scheme: dark)` 안에 둡니다. 테마 토글을 넣지 않기 위한 결정입니다.

## 반복되는 패턴

- **한글 IME**: 키 입력을 처리하는 곳에서는 `e.nativeEvent.isComposing`이 true면 무시합니다. 조합 중 Enter가 확정으로 잡히는 것을 막기 위해서입니다. `TagInput`과 제목 편집이 이 규칙을 따릅니다.
- **편집 가능한 클라이언트 컴포넌트**: 서버에서 받은 값으로 로컬 상태를 초기화하고, 변경 시 서버 액션을 `startTransition`으로 호출합니다. 부모에서 `key`로 리마운트시키지 않습니다. 저장 후 리렌더로 입력 중인 값이 사라집니다.
- **삭제 확인**: `confirm()` 같은 브라우저 다이얼로그 대신 두 단계 버튼(삭제 → 정말 삭제)을 씁니다.
- **동적 페이지**: DB를 읽는 페이지는 `export const dynamic = "force-dynamic"`을 선언합니다.
- **라우트 타입**: 페이지와 라우트 핸들러는 Next가 생성하는 `PageProps<"/path">`, `RouteContext<"/path">`를 씁니다. `params`는 Promise이므로 `await`합니다.
- **에러 재던지기**: 원인을 감싸서 던질 때는 `new Error(message, { cause })`를 씁니다.
