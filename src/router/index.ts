import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import Home from "../views/Home.vue";
import Squad from "../views/Squad.vue";
import Schedule from "../views/Schedule.vue";
import Results from "../views/Results.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", name: "Home", component: Home },
  { path: "/squad", name: "Squad", component: Squad },
  { path: "/schedule", name: "Schedule", component: Schedule },
  { path: "/results", name: "Results", component: Results },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
