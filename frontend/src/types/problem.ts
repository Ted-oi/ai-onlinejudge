// 信息学竞赛分类体系（参照2025年CCF NOI大纲修订版）
export interface ProblemCategory {
  id: string
  name: string
  section: 'syntax' | 'algorithm' | 'algorithm_advanced'
  description?: string
}

export const PROBLEM_CATEGORIES: ProblemCategory[] = [
  // ========== 语法基础 ==========
  {
    id: 'io',
    name: '输入输出',
    section: 'syntax',
    description: '标准输入输出、文件读写'
  },
  {
    id: 'variables',
    name: '变量与数据类型',
    section: 'syntax',
    description: '基本数据类型、常量与变量'
  },
  {
    id: 'control',
    name: '控制语句',
    section: 'syntax',
    description: '条件判断、分支结构'
  },
  {
    id: 'loops',
    name: '循环语句',
    section: 'syntax',
    description: 'for循环、while循环、循环控制'
  },
  {
    id: 'arrays',
    name: '数组操作',
    section: 'syntax',
    description: '一维数组、多维数组、数组操作'
  },
  {
    id: 'strings',
    name: '字符串处理',
    section: 'syntax',
    description: '字符串操作、字符处理'
  },
  {
    id: 'functions',
    name: '函数与递归',
    section: 'syntax',
    description: '函数定义、参数传递、递归函数'
  },
  {
    id: 'structures',
    name: '结构体与类',
    section: 'syntax',
    description: '结构体、类、面向对象基础'
  },

  // ========== 算法基础（入门级，难度1~5） ==========
  {
    id: 'simulation',
    name: '模拟',
    section: 'algorithm',
    description: '按题意模拟过程，难度系数1~2'
  },
  {
    id: 'enumeration',
    name: '枚举',
    section: 'algorithm',
    description: '暴力枚举所有可能情况，难度系数1~2'
  },
  {
    id: 'sorting',
    name: '排序算法',
    section: 'algorithm',
    description: '冒泡排序、选择排序、插入排序、桶排序、归并排序、快速排序，难度系数2~4'
  },
  {
    id: 'binary_search',
    name: '二分查找',
    section: 'algorithm',
    description: '二分查找、二分答案，难度系数4~5'
  },
  {
    id: 'greedy',
    name: '贪心算法',
    section: 'algorithm',
    description: '贪心策略、局部最优到全局最优，难度系数3~4'
  },
  {
    id: 'recursion',
    name: '递推与递归',
    section: 'algorithm',
    description: '递推关系、递归思想、递归函数设计，难度系数3~4'
  },
  {
    id: 'divide_conquer',
    name: '分治算法',
    section: 'algorithm',
    description: '分治策略、归并排序与快速排序的分治思想，难度系数4~5'
  },
  {
    id: 'dfs',
    name: '深度优先搜索',
    section: 'algorithm',
    description: 'DFS遍历、回溯算法、简单搜索剪枝，难度系数4~5'
  },
  {
    id: 'bfs',
    name: '广度优先搜索',
    section: 'algorithm',
    description: 'BFS遍历、层次遍历、最短步数问题，难度系数5'
  },
  {
    id: 'dp_basic',
    name: '动态规划基础',
    section: 'algorithm',
    description: '线性DP、LIS、LCS等基础动态规划，难度系数4~5'
  },
  {
    id: 'graph_basic',
    name: '图论基础',
    section: 'algorithm',
    description: '图的存储与遍历、邻接矩阵与邻接表，难度系数4~5'
  },
  {
    id: 'tree_basic',
    name: '树与二叉树',
    section: 'algorithm',
    description: '二叉树遍历、树的性质、哈夫曼树，难度系数4~5'
  },
  {
    id: 'number_theory',
    name: '数论基础',
    section: 'algorithm',
    description: '最大公约数、素数筛法、唯一分解定理、快速幂，难度系数3~4'
  },
  {
    id: 'stl',
    name: 'C++ STL',
    section: 'algorithm',
    description: 'sort、stack、queue、vector、set、map、priority_queue，难度系数3~5'
  },

  // ========== 算法提高（提高级，难度4~7） ==========
  {
    id: 'search_advanced',
    name: '搜索优化',
    section: 'algorithm_advanced',
    description: '搜索剪枝优化、迭代加深搜索(IDDFS)、启发式搜索(A*)，难度系数6~7'
  },
  {
    id: 'dp_knapsack',
    name: '背包问题',
    section: 'algorithm_advanced',
    description: '0/1背包、完全背包、多重背包、分组背包，难度系数5~6'
  },
  {
    id: 'dp_tree',
    name: '树形DP',
    section: 'algorithm_advanced',
    description: '树上的动态规划、换根DP，难度系数6'
  },
  {
    id: 'dp_interval',
    name: '区间DP',
    section: 'algorithm_advanced',
    description: '区间合并、石子合并等区间动态规划，难度系数6'
  },
  {
    id: 'dp_state',
    name: '状态压缩DP',
    section: 'algorithm_advanced',
    description: '位运算状压、集合状压、旅行商问题(TSP)，难度系数6~7'
  },
  {
    id: 'dp_digit',
    name: '数位DP',
    section: 'algorithm_advanced',
    description: '数位上的计数问题、记忆化搜索，难度系数6~7'
  },
  {
    id: 'shortest_path',
    name: '最短路径',
    section: 'algorithm_advanced',
    description: 'Dijkstra、Bellman-Ford、SPFA、Floyd算法，难度系数5~6'
  },
  {
    id: 'mst',
    name: '最小生成树',
    section: 'algorithm_advanced',
    description: 'Kruskal算法、Prim算法、并查集，难度系数5~6'
  },
  {
    id: 'topo_sort',
    name: '拓扑排序',
    section: 'algorithm_advanced',
    description: '有向无环图的拓扑排序、关键路径，难度系数5'
  },
  {
    id: 'lca',
    name: '最近公共祖先',
    section: 'algorithm_advanced',
    description: 'LCA、倍增法求LCA、Tarjan离线LCA，难度系数6'
  },
  {
    id: 'scc',
    name: '强连通分量',
    section: 'algorithm_advanced',
    description: 'Tarjan算法、Kosaraju算法、缩点，难度系数7'
  },
  {
    id: 'bipartite',
    name: '二分图匹配',
    section: 'algorithm_advanced',
    description: '匈牙利算法、二分图最大匹配、二分图判定，难度系数6~7'
  },
  {
    id: 'string_hash',
    name: '字符串哈希',
    section: 'algorithm_advanced',
    description: '滚动哈希、双哈希、子串匹配，难度系数5~6'
  },
  {
    id: 'kmp',
    name: 'KMP算法',
    section: 'algorithm_advanced',
    description: '模式匹配、next数组、前缀函数，难度系数6'
  },
  {
    id: 'trie',
    name: 'Trie树',
    section: 'algorithm_advanced',
    description: '字典树、前缀树、01Trie，难度系数5~6'
  },
  {
    id: 'manacher',
    name: 'Manacher算法',
    section: 'algorithm_advanced',
    description: '最长回文子串、回文半径（2025年从NOI级下放至提高级），难度系数7'
  },
  {
    id: 'doubling',
    name: '倍增法',
    section: 'algorithm_advanced',
    description: '倍增思想、ST表、倍增求LCA，难度系数6'
  },
  {
    id: 'sweep_line',
    name: '扫描线',
    section: 'algorithm_advanced',
    description: '扫描线算法、矩形面积并（2025年新增），难度系数6~7'
  },
  {
    id: 'offline',
    name: '离线处理',
    section: 'algorithm_advanced',
    description: '离线算法、按询问顺序优化、CDQ分治，难度系数6~7'
  },
  {
    id: 'seg_tree',
    name: '线段树',
    section: 'algorithm_advanced',
    description: '区间修改、区间查询、懒标记、扫描线配合，难度系数6~7'
  },
  {
    id: 'fenwick',
    name: '树状数组',
    section: 'algorithm_advanced',
    description: '单点修改区间查询、逆序对、二维树状数组，难度系数5~6'
  },
  {
    id: 'sparse_table',
    name: 'ST表',
    section: 'algorithm_advanced',
    description: 'RMQ问题、静态区间最值查询，难度系数5~6'
  },
  {
    id: 'balanced_tree',
    name: '平衡树',
    section: 'algorithm_advanced',
    description: 'Treap、Splay、AVL、红黑树等平衡二叉搜索树，难度系数6~7'
  },
  {
    id: 'hld',
    name: '树链剖分',
    section: 'algorithm_advanced',
    description: '重链剖分、路径查询与修改、配合线段树，难度系数7'
  },
]

export const SECTION_TITLES: Record<string, string> = {
  syntax: '语法基础',
  algorithm: '算法基础（入门级）',
  algorithm_advanced: '算法提高（提高级）',
}
