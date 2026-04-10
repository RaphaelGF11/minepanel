<script setup>
import { computed, onMounted, ref } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: 'command-sequence',
  },
  steps: {
    type: Array,
    required: true,
  },
  prompt: {
    type: String,
    default: '$',
  },
  startDelayMs: {
    type: Number,
    default: 220,
  },
  lineGapMs: {
    type: Number,
    default: 260,
  },
  charMs: {
    type: Number,
    default: 55,
  },
});

const rootEl = ref(null);
const isVisible = ref(false);
const reduceMotion = ref(false);

const rows = computed(() => {
  const normalized = Array.isArray(props.steps) ? props.steps : [];
  let delay = props.startDelayMs;
  const list = [];

  normalized.forEach((step, idx) => {
    const command = String(step.command || '');
    const outputs = Array.isArray(step.outputs) ? step.outputs : [];
    const duration = Math.max(850, command.length * props.charMs);

    list.push({
      key: `cmd-${idx}`,
      type: 'command',
      text: command,
      style: {
        '--typing-width': `${command.length}ch`,
        '--typing-duration': `${duration}ms`,
        '--typing-delay': `${delay}ms`,
      },
    });

    delay += duration + 180;

    outputs.forEach((line, lineIdx) => {
      list.push({
        key: `out-${idx}-${lineIdx}`,
        type: 'output',
        text: String(line),
        style: {
          animationDelay: `${delay + lineIdx * props.lineGapMs}ms`,
        },
      });
    });

    delay += outputs.length * props.lineGapMs + 170;
  });

  return list;
});

onMounted(() => {
  if (typeof window === 'undefined') {
    isVisible.value = true;
    return;
  }

  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  reduceMotion.value = media.matches;

  if (media.matches) {
    isVisible.value = true;
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        isVisible.value = true;
        observer.disconnect();
      }
    },
    { threshold: 0.3 },
  );

  if (rootEl.value) {
    observer.observe(rootEl.value);
  }
});
</script>

<template>
  <section ref="rootEl" class="terminal-wrap" aria-label="Terminal sequence demo">
    <div class="terminal" role="img" :aria-label="`Terminal sequence for ${title}`">
      <div class="terminal-bar">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
        <span class="label">{{ title }}</span>
      </div>

      <div class="terminal-body">
        <p v-for="row in rows" :key="row.key" class="line" :class="row.type">
          <template v-if="row.type === 'command'">
            <span class="prompt">{{ prompt }}</span>
            <span class="typed" :class="{ run: isVisible && !reduceMotion }" :style="row.style">
              {{ row.text }}
            </span>
            <span v-if="reduceMotion" class="typed-static">{{ row.text }}</span>
          </template>

          <span
            v-else
            class="output"
            :class="{ run: isVisible && !reduceMotion, static: reduceMotion }"
            :style="row.style"
          >
            {{ row.text }}
          </span>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.terminal-wrap {
  margin: 22px 0 12px;
}

.terminal {
  border: 3px solid rgba(53, 79, 42, 0.8);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 12px 28px rgba(20, 38, 16, 0.25);
  background: #11170f;
}

.terminal-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(180deg, #313f2d 0%, #1f291d 100%);
  border-bottom: 2px solid rgba(122, 166, 93, 0.4);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.red {
  background: #d66b6b;
}

.yellow {
  background: #dfc37f;
}

.green {
  background: #82c763;
}

.label {
  margin-left: 8px;
  color: #dbe8d4;
  font: 400 11px var(--minecraft-font-ui);
  letter-spacing: 0.01em;
}

.terminal-body {
  padding: 14px 16px 16px;
  color: #e9f2e4;
  font: 400 14px/1.6 var(--vp-font-family-mono);
}

.line {
  margin: 0;
  white-space: pre-wrap;
}

.command {
  display: flex;
  align-items: center;
  gap: 10px;
}

.command + .output {
  margin-top: 8px;
}

.prompt {
  color: #7fbe5f;
  font-weight: 700;
}

.typed {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  width: 0;
  border-right: 2px solid #a7e181;
}

.typed.run {
  animation: typing var(--typing-duration) steps(24, end) var(--typing-delay) forwards;
}

.typed-static {
  display: inline-block;
}

.output {
  opacity: 0;
  transform: translateY(4px);
}

.output.run {
  animation: reveal 0.35s ease forwards;
}

.output.static {
  opacity: 1;
  transform: none;
}

@keyframes typing {
  to {
    width: var(--typing-width);
  }
}

@keyframes reveal {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .terminal-body {
    font-size: 13px;
  }
}
</style>
