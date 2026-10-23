import { useRouter } from 'next/router';
import { Button } from 'antd';
import { useWithOnboarding } from '@/hooks/useCheckOnboarding';
import StatusNeoLogo from '@/components/StatusNeoLogo';
import { Path } from '@/utils/enum';

// Entry gate between the landing page and the Wren AI workspace.
// It resolves the onboarding state (connect data source / modeling / home)
// and redirects to the right page.
export default function Launch() {
  const router = useRouter();
  const { error, refetch } = useWithOnboarding();

  return (
    <div className="sn-launch sn-grid-bg">
      <div className="sn-launch__card">
        <StatusNeoLogo height={28} showWren />
        {error ? (
          <>
            <div className="sn-launch__title sn-glow-text">
              Backend not reachable
            </div>
            <p className="sn-launch__text">
              The Wren services are still starting or are unavailable. Give them
              a few seconds and retry.
            </p>
            <div className="sn-launch__actions">
              <Button type="primary" onClick={() => refetch()}>
                Retry connection
              </Button>
              <Button onClick={() => router.push(Path.Landing)}>
                Back to landing
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="sn-launch__title sn-glow-text">
              Initializing workspace
            </div>
            <div className="sn-launch__bar">
              <span />
            </div>
            <p className="sn-launch__text">
              Syncing semantic layer &amp; data connections…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
