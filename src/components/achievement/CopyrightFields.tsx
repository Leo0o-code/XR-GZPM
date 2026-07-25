import { Col, Form, Input, Row } from 'antd';

export function CopyrightFields() {
  return (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="软件简称" name="shortName">
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="版本号" name="version">
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="著作权人" name="copyrightOwner">
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="软件开发者" name="developers">
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="开发完成日期" name="completionDate">
          <Input type="date" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="登记申请日期" name="registrationApplicationDate">
          <Input type="date" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="登记号" name="registrationNumber">
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="发证日期" name="certificateDate">
          <Input type="date" />
        </Form.Item>
      </Col>
    </Row>
  );
}
