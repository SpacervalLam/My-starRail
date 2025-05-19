<template>
  <aside class="sidebar">
    <nav>
      <ul>
        <li>
          <router-link to="/gacha-analysis" active-class="active">
            <font-awesome-icon icon="chart-pie" />
            <span class="link-text">抽卡分析</span>
          </router-link>
        </li>
        <li>
          <router-link to="/enka-profile" active-class="active">
            <font-awesome-icon icon="user" />
            <span class="link-text">玩家档案</span>
          </router-link>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script lang="ts">
export default {
  name: 'Sidebar',
};
</script>

<style scoped>
.sidebar {
  width: 60px;
  overflow: hidden;
  transition: width 0.3s ease;
  background-color: #1f2937;
  color: #fff;
  padding-top: 2.5rem;
  padding-left: -1rem;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
}
.sidebar:hover {
  width: 220px;
}

.sidebar ul {
  list-style: none;
  padding: 0;
  min-width: 220px;
  white-space: nowrap;
}

.sidebar li {
  margin: 1rem 0;
}

.sidebar a {
  color: #fff;
  text-decoration: none;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  border-radius: 6px;
  transition: background 0.2s;
}

.sidebar a svg {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
}

.sidebar a .link-text {
  margin-left: 1rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.sidebar:hover a .link-text {
  opacity: 1;
}

.sidebar a:hover {
  background-color: #374151;
}

.sidebar a.active {
  background-color: #4b5563;
  font-weight: bold;
}
</style>
