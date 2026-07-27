import { Card, Col, Row, Statistic, Typography } from 'antd';
import { useAppStore } from '../store';
import { generateWarnings } from '../utils/warnings';
import { calculateDomesticJournalRatio } from '../utils/stats';

const { Title, Paragraph } = Typography;

export function HomePage() {
  const { project, topics, units, nodes, indicators, achievements, warningRules } = useAppStore();

  const unitMap = Object.fromEntries(units.map((u) => [u.id, u.name]));
  const warnings = generateWarnings(indicators, achievements, nodes, topics, warningRules, unitMap);
  const ratioData = calculateDomesticJournalRatio(achievements, topics);

  const totalIndicators = indicators.length;
  const totalAchievements = achievements.length;
  const approvedAchievements = achievements.filter((a) => a.status === '审批通过').length;

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Title level={3}>{project.name}</Title>
        <Paragraph>
          项目编号：{project.code}｜起止时间：{project.startDate} 至 {project.endDate}
        </Paragraph>
        <Paragraph>
          本系统用于对国家科技重大专项项目实施过程中形成的科研成果和项目材料进行统一管理。
        </Paragraph>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="课题数量" value={topics.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已配置指标" value={totalIndicators} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已录入成果" value={totalAchievements} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已审批成果" value={approvedAchievements} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="当前预警数">
            <Statistic value={warnings.length} valueStyle={{ color: warnings.length > 0 ? '#cf1322' : '#3f8600' }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="国内期刊论文情况">
            <Statistic
              value={ratioData.ratio !== null ? `${ratioData.chinese}/${ratioData.total}（${ratioData.ratio}%）` : '暂无数据'}
              suffix={`要求 ≥ ${ratioData.minRequiredCount} 篇`}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
