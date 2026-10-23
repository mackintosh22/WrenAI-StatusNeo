import { useRouter } from 'next/router';
import { Button, Layout, Space } from 'antd';
import styled from 'styled-components';
import LogoBar from '@/components/LogoBar';
import { Path } from '@/utils/enum';
import Deploy from '@/components/deploy/Deploy';

const { Header } = Layout;

const StyledButton = styled(Button)<{ $isHighlight: boolean }>`
  background: ${(props) =>
    props.$isHighlight ? 'rgba(255, 214, 0, 0.14)' : 'transparent'};
  font-weight: ${(props) => (props.$isHighlight ? '700' : 'normal')};
  border: none;
  color: ${(props) => (props.$isHighlight ? '#ffd600' : '#cfcfcf')};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 12px;

  &:hover,
  &:focus {
    background: rgba(255, 214, 0, 0.1);
    color: #ffd600;
    box-shadow: none;
  }
`;

const StyledHeader = styled(Header)`
  height: 48px;
  border-bottom: 1px solid rgba(255, 214, 0, 0.35);
  background: linear-gradient(180deg, #000 0%, #070707 100%);
  box-shadow: 0 1px 24px rgba(255, 214, 0, 0.08);
  padding: 10px 16px;
`;

const LogoLink = styled.button`
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
`;

export default function HeaderBar() {
  const router = useRouter();
  const { pathname } = router;
  const showNav = !pathname.startsWith(Path.Onboarding);
  const isModeling = pathname.startsWith(Path.Modeling);

  return (
    <StyledHeader>
      <div
        className="d-flex justify-space-between align-center"
        style={{ marginTop: -2 }}
      >
        <Space size={[48, 0]}>
          <LogoLink
            type="button"
            title="Back to StatusNeo × Wren AI landing page"
            aria-label="Back to landing page"
            onClick={() => router.push(Path.Landing)}
          >
            <LogoBar />
          </LogoLink>
          {showNav && (
            <Space size={[16, 0]}>
              <StyledButton
                shape="round"
                size="small"
                $isHighlight={pathname.startsWith(Path.Home)}
                onClick={() => router.push(Path.Home)}
              >
                Home
              </StyledButton>
              <StyledButton
                shape="round"
                size="small"
                $isHighlight={pathname.startsWith(Path.Modeling)}
                onClick={() => router.push(Path.Modeling)}
              >
                Modeling
              </StyledButton>
              <StyledButton
                shape="round"
                size="small"
                $isHighlight={pathname.startsWith(Path.Knowledge)}
                onClick={() => router.push(Path.KnowledgeQuestionSQLPairs)}
              >
                Knowledge
              </StyledButton>
              <StyledButton
                shape="round"
                size="small"
                $isHighlight={pathname.startsWith(Path.APIManagement)}
                onClick={() => router.push(Path.APIManagementHistory)}
              >
                API
              </StyledButton>
            </Space>
          )}
        </Space>
        {isModeling && (
          <Space size={[16, 0]}>
            <Deploy />
          </Space>
        )}
      </div>
    </StyledHeader>
  );
}
