import dayjs from 'dayjs';
import type { WarningLevel } from '../types';

export const formatDate = (date: string) => dayjs(date).format('YYYY-MM-DD');
export const daysUntil = (date: string) => dayjs(date).diff(dayjs(), 'day');

export const levelLabel = (level: WarningLevel | null) => {
  switch (level) { case 'yellow': return '黄色预警'; case 'orange': return '橙色预警'; case 'red': return '红色预警'; default: return '正常'; }
};
export const levelColor = (level: WarningLevel | null) => {
  switch (level) { case 'yellow': return '#faad14'; case 'orange': return '#fa8c16'; case 'red': return '#f5222d'; default: return '#52c41a'; }
};

export const statusOptions = ['草稿', '已发布', '已调整', '已停用'];

export const paperTypeOptions: Array<'SCI' | 'EI' | '中文核心'> = ['SCI', 'EI', '中文核心'];
export const patentScopeOptions: Array<'国内' | '国际'> = ['国内', '国际'];
export const educationLevelOptions: Array<'博士' | '硕士'> = ['博士', '硕士'];
export const materialStatusOptions = ['未提交', '待审核', '审核通过', '退回修改'];

export const defaultRecognitionStatus: Record<string, string> = {
  学术论文: '已录用', 发明专利: '已受理', 软件著作权: '已取得证书', 标准规范: '形成送审稿', 人才培养: '已取得证明材料',
};
export const defaultMaterialRequirements: Record<string, string[]> = {
  学术论文: ['录用通知', '论文全文', '正式刊出页面', '检索证明'],
  发明专利: ['专利受理通知书', '授权通知书', '专利证书'],
  软件著作权: ['软件著作权登记证书'],
  标准规范: ['标准送审稿', '送审提交证明', '编制说明'],
  人才培养: ['学位论文', '答辩证明', '学位授予证明'],
};

export const progressOptionsByType: Record<string, string[]> = {
  学术论文: ['计划中', '撰写中', '已投稿', '审稿中', '返修中', '已录用', '已刊出'],
  发明专利: ['计划中', '交底书编制', '内部审核', '已提交申请', '已受理', '实质审查', '已授权'],
  软件著作权: ['计划中', '软件开发', '材料编制', '已提交登记', '审核中', '已取得证书'],
  标准规范: ['计划中', '标准起草', '征求意见', '修改完善', '形成送审稿', '已提交送审'],
  人才培养: ['培养中', '论文开题', '论文撰写', '论文答辩', '已取得证明材料'],
};
export const getProgressOptions = (type: string) => progressOptionsByType[type] || [];
