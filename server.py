from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import heapq
from fractions import Fraction
import re
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')

def _static_dir():
    return PUBLIC_DIR if os.path.isdir(PUBLIC_DIR) else BASE_DIR

# Serve the main page
@app.route('/')
def serve_index():
    return send_from_directory(_static_dir(), 'index.html')

# Serve other static files (CSS, JS, etc.)
@app.route('/<path:path>')
def serve_static(path):
    root = _static_dir()
    candidate = os.path.join(root, path)
    if os.path.isfile(candidate):
        return send_from_directory(root, path)
    return send_from_directory(BASE_DIR, path)

# =================== SORTING ALGORITHMS ===================
@app.route('/api/sort', methods=['POST'])
def sort_array():
    try:
        data = request.json
        algo = data.get('algo')
        array = data.get('array', [])
        
        ops = []
        
        if algo == 'bubble':
            ops = bubble_sort(array[:])
        elif algo == 'selection':
            ops = selection_sort(array[:])
        elif algo == 'insertion':
            ops = insertion_sort(array[:])
        elif algo == 'merge':
            ops = merge_sort(array[:])
        elif algo == 'quick':
            ops = quick_sort(array[:])
        elif algo == 'heap':
            ops = heap_sort(array[:])
        elif algo == 'shell':
            ops = shell_sort(array[:])
        elif algo == 'counting':
            ops = counting_sort(array[:])
        elif algo == 'radix':
            ops = radix_sort(array[:])
        elif algo == 'bucket':
            ops = bucket_sort(array[:])
        elif algo == 'comb':
            ops = comb_sort(array[:])
        elif algo == 'tim':
            ops = tim_sort(array[:])
        else:
            return jsonify({'error': f'Unknown algorithm: {algo}'}), 400
        
        return jsonify({'ops': ops})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

def bubble_sort(arr):
    ops = []
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            ops.append({'type': 'compare', 'i': j, 'j': j+1})
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
                ops.append({'type': 'swap', 'i': j, 'j': j+1})
    return ops

def selection_sort(arr):
    ops = []
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i+1, n):
            ops.append({'type': 'compare', 'i': min_idx, 'j': j})
            if arr[j] < arr[min_idx]:
                min_idx = j
        if min_idx != i:
            arr[i], arr[min_idx] = arr[min_idx], arr[i]
            ops.append({'type': 'swap', 'i': i, 'j': min_idx})
    return ops

def insertion_sort(arr):
    ops = []
    for i in range(1, len(arr)):
        key = arr[i]
        j = i-1
        while j >= 0 and key < arr[j]:
            ops.append({'type': 'compare', 'i': j, 'j': j+1})
            arr[j+1] = arr[j]
            ops.append({'type': 'set', 'i': j+1, 'value': arr[j]})
            j -= 1
        arr[j+1] = key
        ops.append({'type': 'set', 'i': j+1, 'value': key})
    return ops

def merge_sort(arr):
    ops = []
    
    def merge(left, right):
        merged = []
        i = j = 0
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                merged.append(left[i])
                i += 1
            else:
                merged.append(right[j])
                j += 1
        merged.extend(left[i:])
        merged.extend(right[j:])
        return merged
    
    def recursive_merge_sort(sub_arr, start_idx):
        if len(sub_arr) <= 1:
            return sub_arr, []
        
        mid = len(sub_arr) // 2
        left, left_ops = recursive_merge_sort(sub_arr[:mid], start_idx)
        right, right_ops = recursive_merge_sort(sub_arr[mid:], start_idx + mid)
        
        merged = merge(left, right)
        
        for i, val in enumerate(merged):
            ops.append({'type': 'set', 'i': start_idx + i, 'value': val})
        
        return merged, ops
    
    sorted_arr, _ = recursive_merge_sort(arr, 0)
    return ops

def quick_sort(arr):
    ops = []
    
    def partition(low, high):
        pivot = arr[high]
        i = low - 1
        
        for j in range(low, high):
            ops.append({'type': 'compare', 'i': j, 'j': high})
            if arr[j] <= pivot:
                i += 1
                arr[i], arr[j] = arr[j], arr[i]
                if i != j:
                    ops.append({'type': 'swap', 'i': i, 'j': j})
        
        arr[i+1], arr[high] = arr[high], arr[i+1]
        ops.append({'type': 'swap', 'i': i+1, 'j': high})
        return i + 1
    
    def recursive_quick_sort(low, high):
        if low < high:
            pi = partition(low, high)
            recursive_quick_sort(low, pi-1)
            recursive_quick_sort(pi+1, high)
    
    recursive_quick_sort(0, len(arr)-1)
    return ops

def heap_sort(arr):
    ops = []
    n = len(arr)
    
    def heapify(n, i):
        largest = i
        left = 2 * i + 1
        right = 2 * i + 2
        
        if left < n:
            ops.append({'type': 'compare', 'i': left, 'j': largest})
            if arr[left] > arr[largest]:
                largest = left
        
        if right < n:
            ops.append({'type': 'compare', 'i': right, 'j': largest})
            if arr[right] > arr[largest]:
                largest = right
        
        if largest != i:
            arr[i], arr[largest] = arr[largest], arr[i]
            ops.append({'type': 'swap', 'i': i, 'j': largest})
            heapify(n, largest)
    
    for i in range(n//2 - 1, -1, -1):
        heapify(n, i)
    
    for i in range(n-1, 0, -1):
        arr[i], arr[0] = arr[0], arr[i]
        ops.append({'type': 'swap', 'i': i, 'j': 0})
        heapify(i, 0)
    
    return ops


def shell_sort(arr):
    ops = []
    n = len(arr)
    gap = n // 2
    
    ops.append({'type': 'gap_change', 'gap': gap})
    
    while gap > 0:
        # Send gap change operation for EACH gap
        ops.append({'type': 'gap_change', 'gap': gap})
        
        for i in range(gap, n):
            temp = arr[i]
            j = i
            
            while j >= gap and arr[j - gap] > temp:
                ops.append({'type': 'compare', 'i': j - gap, 'j': j, 'gap': gap})
                
                arr[j] = arr[j - gap]
                ops.append({'type': 'set', 'i': j, 'value': arr[j - gap], 'gap': gap})
                j -= gap
            
            if j != i: 
                arr[j] = temp
                ops.append({'type': 'set', 'i': j, 'value': temp, 'gap': gap})
            elif j >= gap:
                ops.append({'type': 'compare', 'i': j - gap, 'j': j, 'gap': gap})
        
        gap //= 2
        if gap > 0:
            ops.append({'type': 'gap_change', 'gap': gap})
    
    return ops

def counting_sort(arr):
    ops = []
    if not arr:
        return ops
    
    max_val = max(arr)
    min_val = min(arr)
    
    count = [0] * (max_val - min_val + 1)
    
    for num in arr:
        count[num - min_val] += 1
    
    output = []
    for i, cnt in enumerate(count):
        for _ in range(cnt):
            output.append(i + min_val)
    
    for i, val in enumerate(output):
        ops.append({'type': 'set', 'i': i, 'value': val})
    
    return ops

def radix_sort(arr):
    ops = []
    if not arr:
        return ops
    
    max_val = max(arr)
    exp = 1
    
    while max_val // exp > 0:
        output = [0] * len(arr)
        count = [0] * 10
        
        for num in arr:
            count[(num // exp) % 10] += 1
        
        for i in range(1, 10):
            count[i] += count[i-1]
        
        i = len(arr) - 1
        while i >= 0:
            digit = (arr[i] // exp) % 10
            output[count[digit] - 1] = arr[i]
            count[digit] -= 1
            i -= 1
        
        for i in range(len(arr)):
            if arr[i] != output[i]:
                arr[i] = output[i]
                ops.append({'type': 'set', 'i': i, 'value': output[i]})
        
        exp *= 10
    
    return ops

def bucket_sort(arr):
    ops = []
    if not arr:
        return ops
    
    max_val = max(arr)
    min_val = min(arr)
    bucket_count = len(arr)
    
    buckets = [[] for _ in range(bucket_count)]
    
    for num in arr:
        index = int((num - min_val) / (max_val - min_val + 1) * bucket_count)
        buckets[index].append(num)
    
    for bucket in buckets:
        bucket.sort()
    
    output = []
    for bucket in buckets:
        output.extend(bucket)
    
    for i, val in enumerate(output):
        ops.append({'type': 'set', 'i': i, 'value': val})
    
    return ops

def comb_sort(arr):
    ops = []
    n = len(arr)
    gap = n
    shrink = 1.3
    sorted = False
    
    while not sorted:
        gap = int(gap / shrink)
        if gap <= 1:
            gap = 1
            sorted = True
        
        for i in range(n - gap):
            ops.append({'type': 'compare', 'i': i, 'j': i + gap, 'gap': gap})
            if arr[i] > arr[i + gap]:
                arr[i], arr[i + gap] = arr[i + gap], arr[i]
                ops.append({'type': 'swap', 'i': i, 'j': i + gap, 'gap': gap})
                sorted = False
    
    return ops

def tim_sort(arr):
    ops = []
    sorted_arr = sorted(arr)
    for i, val in enumerate(sorted_arr):
        if i < len(arr) and arr[i] != val:
            ops.append({'type': 'set', 'i': i, 'value': val})
    return ops

# =================== GREEDY ALGORITHMS ===================
# Activity Selection
@app.route('/api/greedy/activity', methods=['POST'])
def activity_selection():
    try:
        data = request.json
        activities_str = data.get('activities', '')

        activities = []
        for pair in activities_str.split(';'):
            if pair.strip():
                start, end = map(int, pair.split(','))
                activities.append((start, end))
        
        activities.sort(key=lambda x: x[1])
        
        selected = []
        steps = []
        last_end = -1
        
        for i, (start, end) in enumerate(activities):
            if start >= last_end:
                selected.append(f"({start},{end})")
                steps.append(f"Select activity ({start},{end}) - starts after previous ends")
                last_end = end
            else:
                steps.append(f"Skip activity ({start},{end}) - overlaps with previous")
        
        return jsonify({
            'selected': selected,
            'count': len(selected),
            'steps': steps
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/greedy/knapsack', methods=['POST'])
def knapsack_greedy():
    try:
        data = request.json
        items_str = data.get('items', '')
        capacity = data.get('capacity', 0)
        
        items = []
        for pair in items_str.split(';'):
            if pair.strip():
                weight, value = map(int, pair.split(','))
                items.append({
                    'weight': weight,
                    'value': value,
                    'ratio': value / weight
                })
        
        items.sort(key=lambda x: x['ratio'], reverse=True)
        
        current_weight = 0
        total_value = 0
        selected_items = []
        steps = []
        
        for i, item in enumerate(items):
            if current_weight + item['weight'] <= capacity:
                selected_items.append(f"Item{i+1}(w:{item['weight']},v:{item['value']})")
                current_weight += item['weight']
                total_value += item['value']
                steps.append(f"Take Item{i+1} - weight:{item['weight']}, value:{item['value']}, ratio:{item['ratio']:.2f}")
            else:
                steps.append(f"Skip Item{i+1} - would exceed capacity")
        
        return jsonify({
            'maxValue': total_value,
            'selectedItems': selected_items,
            'steps': steps
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/greedy/egyptian', methods=['POST'])
def egyptian_fractions():
    try:
        data = request.json
        numerator = data.get('numerator', 0)
        denominator = data.get('denominator', 1)
        
        fractions = []
        steps = []
        
        nr, dr = numerator, denominator
        
        while nr != 0:
            x = (dr + nr - 1) // nr
            fractions.append(f"1/{x}")
            steps.append(f"{nr}/{dr} = 1/{x} + remainder")
            
            nr = nr * x - dr
            dr = dr * x
            
            gcd_val = gcd(nr, dr)
            if gcd_val > 1:
                nr //= gcd_val
                dr //= gcd_val
                steps.append(f"Simplify to {nr}/{dr}")
        
        return jsonify({
            'fractions': fractions,
            'steps': steps
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

def gcd(a, b):
    while b:
        a, b = b, a % b
    return a

# Job Sequencing
@app.route('/api/greedy/job-sequencing', methods=['POST'])
def job_sequencing():
    try:
        data = request.json
        jobs_str = data.get('jobs', '')
        
        jobs = []
        for job_str in jobs_str.split(';'):
            if job_str.strip():
                parts = job_str.split(',')
                if len(parts) == 3:
                    job_id = parts[0].strip()
                    deadline = int(parts[1])
                    profit = int(parts[2])
                    jobs.append({'id': job_id, 'deadline': deadline, 'profit': profit})
        
        jobs.sort(key=lambda x: x['profit'], reverse=True)
        
        max_deadline = max(job['deadline'] for job in jobs) if jobs else 0
        timeline = [None] * (max_deadline + 1)
        total_profit = 0
        sequence = []
        steps = []
        
        for job in jobs:
            for t in range(job['deadline'], 0, -1):
                if timeline[t] is None:
                    timeline[t] = job
                    sequence.append(job['id'])
                    total_profit += job['profit']
                    steps.append(f"Schedule job {job['id']} at time {t} (profit: {job['profit']})")
                    break
            else:
                steps.append(f"Cannot schedule job {job['id']} - no available slot")
        
        return jsonify({
            'maxProfit': total_profit,
            'sequence': sequence,
            'steps': steps
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Huffman Coding
@app.route('/api/greedy/huffman', methods=['POST'])
def huffman_coding():
    try:
        data = request.json
        text = data.get('pairs', '')
        
        freq = {}
        for char in text:
            freq[char] = freq.get(char, 0) + 1
        
        import heapq
        
        class Node:
            def __init__(self, freq, char=None, left=None, right=None):
                self.freq = freq
                self.char = char
                self.left = left
                self.right = right
            
            def __lt__(self, other):
                return self.freq < other.freq
        
        heap = []
        for char, weight in freq.items():
            heapq.heappush(heap, Node(weight, char))
        
        steps = []
        steps.append("Initial frequencies: " + str(freq))
        
        while len(heap) > 1:
            left = heapq.heappop(heap)
            right = heapq.heappop(heap)
            
            internal_freq = left.freq + right.freq
            internal_node = Node(internal_freq, left=left, right=right)
            
            heapq.heappush(heap, internal_node)
            steps.append(f"Merged '{left.char if left.char else 'internal'}'({left.freq}) and '{right.char if right.char else 'internal'}'({right.freq}) -> internal({internal_freq})")
        
        def generate_codes(node, current_code="", codes=None):
            if codes is None:
                codes = {}
            
            if node is None:
                return codes
            
            if node.char is not None:
                codes[node.char] = current_code
                return codes
            
            generate_codes(node.left, current_code + "0", codes)
            generate_codes(node.right, current_code + "1", codes)
            
            return codes
        
        root = heap[0] if heap else None
        codes = generate_codes(root) if root else {}
        
        # Build tree structure for visualization
        def build_tree_dict(node):
            if node is None:
                return None
            
            node_dict = {
                'freq': node.freq,
                'sym': node.char,
                'left': build_tree_dict(node.left),
                'right': build_tree_dict(node.right)
            }
            return node_dict
        
        tree_struct = build_tree_dict(root) if root else None
        
        return jsonify({
            'codes': codes,
            'struct': tree_struct,
            'steps': steps
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# =================== MATHEMATICAL ALGORITHMS ===================
# Extended Euclidean Algorithm
@app.route('/api/math/extended-euclidean', methods=['POST'])
def extended_euclidean():
    try:
        data = request.json
        a = int(data.get('a', 0))
        b = int(data.get('b', 0))
        
        if a == 0 and b == 0:
            return jsonify({'error': 'Both numbers cannot be zero'}), 400
        
        steps = []
        steps.append(f"Finding gcd({a}, {b}) using Extended Euclidean Algorithm")
        steps.append(f"Initial: a = {a}, b = {b}")
        
        if abs(a) < abs(b):
            a, b = b, a
            steps.append(f"Swapped to ensure |a| >= |b|: a = {a}, b = {b}")
        
        x0, x1 = 1, 0
        y0, y1 = 0, 1
        r0, r1 = a, b
        
        steps.append("")
        steps.append("Using the recurrence relations:")
        steps.append("r₍ᵢ₊₁₎ = r₍ᵢ₋₁₎ - qᵢ * rᵢ")
        steps.append("x₍ᵢ₊₁₎ = x₍ᵢ₋₁₎ - qᵢ * xᵢ") 
        steps.append("y₍ᵢ₊₁₎ = y₍ᵢ₋₁₎ - qᵢ * yᵢ")
        steps.append("")
        steps.append(f"Step 0: r₀ = {r0}, x₀ = {x0}, y₀ = {y0}")
        steps.append(f"Step 1: r₁ = {r1}, x₁ = {x1}, y₁ = {y1}")
        
        iteration = 2
        while r1 != 0:
            q = r0 // r1
            r2 = r0 - q * r1
            x2 = x0 - q * x1
            y2 = y0 - q * y1
            
            steps.append("")
            steps.append(f"Step {iteration}:")
            steps.append(f"q = r₍ᵢ₋₁₎ // rᵢ = {r0} // {r1} = {q}")
            steps.append(f"r₍ᵢ₊₁₎ = r₍ᵢ₋₁₎ - q * rᵢ = {r0} - {q} * {r1} = {r2}")
            steps.append(f"x₍ᵢ₊₁₎ = x₍ᵢ₋₁₎ - q * xᵢ = {x0} - {q} * {x1} = {x2}")
            steps.append(f"y₍ᵢ₊₁₎ = y₍ᵢ₋₁₎ - q * yᵢ = {y0} - {q} * {y1} = {y2}")
            
            r0, r1 = r1, r2
            x0, x1 = x1, x2
            y0, y1 = y1, y2
            iteration += 1
        
        gcd_val = r0
        x = x0
        y = y0
        
        steps.append("")
        steps.append("=== RESULT ===")
        steps.append(f"gcd({a}, {b}) = {gcd_val}")
        steps.append(f"Bézout coefficients: x = {x}, y = {y}")
        steps.append(f"Verification: {a}*{x} + {b}*{y} = {a*x} + {b*y} = {a*x + b*y}")
        
        if gcd_val < 0:
            gcd_val = -gcd_val
            x = -x
            y = -y
            steps.append(f"Adjusted for positive gcd: gcd = {gcd_val}, x = {x}, y = {y}")
        
        return jsonify({
            'gcd': gcd_val,
            'x': x,
            'y': y,
            'verification': a*x + b*y,
            'steps': steps
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Chinese Remainder Theorem
@app.route('/api/math/chinese-remainder', methods=['POST'])
def chinese_remainder():
    try:
        data = request.json
        pairs_str = data.get('pairs', '')
        
        # Parse pairs: "a1,m1;a2,m2;..."
        pairs = []
        moduli = []
        steps = []
        
        for pair_str in pairs_str.split(';'):
            if pair_str.strip():
                a, m = map(int, pair_str.split(','))
                pairs.append((a, m))
                moduli.append(m)
        
        if len(pairs) < 2:
            return jsonify({'error': 'At least two congruence pairs required'}), 400
        
        steps.append("=== CHINESE REMAINDER THEOREM ===")
        steps.append(f"Solving system of congruences:")
        for i, (a, m) in enumerate(pairs):
            steps.append(f"x ≡ {a} (mod {m})")
        
        steps.append("")
        steps.append("Step 1: Calculate product of all moduli")
        M = 1
        for m in moduli:
            M *= m
        steps.append(f"M = {' × '.join(map(str, moduli))} = {M}")
        
        steps.append("")
        steps.append("Step 2: Calculate Mᵢ = M / mᵢ for each modulus")
        M_i = []
        for i, (a, m) in enumerate(pairs):
            M_i_val = M // m
            M_i.append(M_i_val)
            steps.append(f"M_{i+1} = M / m_{i+1} = {M} / {m} = {M_i_val}")
        
        steps.append("")
        steps.append("Step 3: Find multiplicative inverses yᵢ such that Mᵢ × yᵢ ≡ 1 (mod mᵢ)")
        y_i = []
        for i, ((a, m), M_i_val) in enumerate(zip(pairs, M_i)):
            steps.append(f"")
            steps.append(f"Finding y_{i+1} such that {M_i_val} × y_{i+1} ≡ 1 (mod {m})")
            
            # Extended Euclidean for this pair
            r0, r1 = M_i_val, m
            t0, t1 = 0, 1
            
            substeps = []
            substeps.append(f"Using Extended Euclidean Algorithm for gcd({M_i_val}, {m})")
            
            iteration = 0
            while r1 != 0:
                q = r0 // r1
                r2 = r0 - q * r1
                t2 = t0 - q * t1
                
                substeps.append(f"q = {q}, r = {r2}, t = {t2}")
                
                r0, r1 = r1, r2
                t0, t1 = t1, t2
                iteration += 1
            
            y = t0 % m
            if y < 0:
                y += m
            
            substeps.append(f"Inverse found: y_{i+1} = {y}")
            substeps.append(f"Verification: {M_i_val} × {y} mod {m} = {(M_i_val * y) % m}")
            steps.extend(substeps)
            y_i.append(y)
        
        steps.append("")
        steps.append("Step 4: Calculate solution x = Σ(aᵢ × Mᵢ × yᵢ) mod M")
        x = 0
        calculation_parts = []
        for i, ((a, m), M_i_val, y_val) in enumerate(zip(pairs, M_i, y_i)):
            term = a * M_i_val * y_val
            x += term
            calculation_parts.append(f"{a}×{M_i_val}×{y_val}")
            steps.append(f"Term {i+1}: {a} × {M_i_val} × {y_val} = {term}")
        
        x %= M
        if x < 0:
            x += M
        
        steps.append("")
        steps.append(f"Sum = {' + '.join(calculation_parts)} = {sum(a * M_i_val * y_val for (a, m), M_i_val, y_val in zip(pairs, M_i, y_i))}")
        steps.append(f"x = {sum(a * M_i_val * y_val for (a, m), M_i_val, y_val in zip(pairs, M_i, y_i))} mod {M} = {x}")
        
        steps.append("")
        steps.append("=== VERIFICATION ===")
        for i, (a, m) in enumerate(pairs):
            verification = x % m
            status = "✓" if verification == a % m else "✗"
            steps.append(f"x mod {m} = {verification}, should be {a % m} {status}")
        
        steps.append("")
        steps.append("=== FINAL RESULT ===")
        steps.append(f"Solution: x ≡ {x} (mod {M})")
        steps.append(f"General solution: x = {x} + {M}k, where k is any integer")
        
        return jsonify({
            'solution': x,
            'modulus': M,
            'general_solution': f"{x} + {M}k",
            'steps': steps
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# =================== MORE ALGORITHMS ENDPOINT ===================
@app.route('/api/more', methods=['POST'])
def more_algorithms():
    try:
        data = request.json
        algo = data.get('algo')
        a = data.get('a')
        b = data.get('b')
        pairs = data.get('pairs')
        
        if algo == 'extended-euclidean':
            # Create a new request data for extended Euclidean
            euclid_data = {
                'a': int(a) if a else 0,
                'b': int(b) if b else 0
            }
            return extended_euclidean_internal(euclid_data)
            
        elif algo == 'chinese-remainder':
            # Create a new request data for Chinese Remainder
            crt_data = {
                'pairs': pairs if pairs else ""
            }
            return chinese_remainder_internal(crt_data)
            
        else:
            return jsonify({'error': f'Unknown algorithm: {algo}'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Internal versions of the algorithms for use by /api/more
def extended_euclidean_internal(data):
    try:
        a = int(data.get('a', 0))
        b = int(data.get('b', 0))
        
        if a == 0 and b == 0:
            return jsonify({'error': 'Both numbers cannot be zero'}), 400
        
        steps = []
        steps.append(f"Finding gcd({a}, {b}) using Extended Euclidean Algorithm")
        steps.append(f"Initial: a = {a}, b = {b}")
        
        # Ensure a >= b for the algorithm
        if abs(a) < abs(b):
            a, b = b, a
            steps.append(f"Swapped to ensure |a| >= |b|: a = {a}, b = {b}")
        
        x0, x1 = 1, 0
        y0, y1 = 0, 1
        r0, r1 = a, b
        
        steps.append("")
        steps.append("Using the recurrence relations:")
        steps.append("r₍ᵢ₊₁₎ = r₍ᵢ₋₁₎ - qᵢ * rᵢ")
        steps.append("x₍ᵢ₊₁₎ = x₍ᵢ₋₁₎ - qᵢ * xᵢ") 
        steps.append("y₍ᵢ₊₁₎ = y₍ᵢ₋₁₎ - qᵢ * yᵢ")
        steps.append("")
        steps.append(f"Step 0: r₀ = {r0}, x₀ = {x0}, y₀ = {y0}")
        steps.append(f"Step 1: r₁ = {r1}, x₁ = {x1}, y₁ = {y1}")
        
        iteration = 2
        while r1 != 0:
            q = r0 // r1
            r2 = r0 - q * r1
            x2 = x0 - q * x1
            y2 = y0 - q * y1
            
            steps.append("")
            steps.append(f"Step {iteration}:")
            steps.append(f"q = r₍ᵢ₋₁₎ // rᵢ = {r0} // {r1} = {q}")
            steps.append(f"r₍ᵢ₊₁₎ = r₍ᵢ₋₁₎ - q * rᵢ = {r0} - {q} * {r1} = {r2}")
            steps.append(f"x₍ᵢ₊₁₎ = x₍ᵢ₋₁₎ - q * xᵢ = {x0} - {q} * {x1} = {x2}")
            steps.append(f"y₍ᵢ₊₁₎ = y₍ᵢ₋₁₎ - q * yᵢ = {y0} - {q} * {y1} = {y2}")
            
            # Update for next iteration
            r0, r1 = r1, r2
            x0, x1 = x1, x2
            y0, y1 = y1, y2
            iteration += 1
        
        gcd_val = r0
        x = x0
        y = y0
        
        steps.append("")
        steps.append("=== RESULT ===")
        steps.append(f"gcd({a}, {b}) = {gcd_val}")
        steps.append(f"Bézout coefficients: x = {x}, y = {y}")
        steps.append(f"Verification: {a}*{x} + {b}*{y} = {a*x} + {b*y} = {a*x + b*y}")
        
        # Handle negative gcd for negative inputs
        if gcd_val < 0:
            gcd_val = -gcd_val
            x = -x
            y = -y
            steps.append(f"Adjusted for positive gcd: gcd = {gcd_val}, x = {x}, y = {y}")
        
        return jsonify({
            'gcd': gcd_val,
            'x': x,
            'y': y,
            'verification': a*x + b*y,
            'steps': steps
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

def chinese_remainder_internal(data):
    try:
        pairs_str = data.get('pairs', '')
        
        # Parse pairs: "a1,m1;a2,m2;..."
        pairs = []
        moduli = []
        steps = []
        
        for pair_str in pairs_str.split(';'):
            if pair_str.strip():
                a, m = map(int, pair_str.split(','))
                pairs.append((a, m))
                moduli.append(m)
        
        if len(pairs) < 2:
            return jsonify({'error': 'At least two congruence pairs required'}), 400
        
        steps.append("=== CHINESE REMAINDER THEOREM ===")
        steps.append(f"Solving system of congruences:")
        for i, (a, m) in enumerate(pairs):
            steps.append(f"x ≡ {a} (mod {m})")
        
        steps.append("")
        steps.append("Step 1: Calculate product of all moduli")
        M = 1
        for m in moduli:
            M *= m
        steps.append(f"M = {' × '.join(map(str, moduli))} = {M}")
        
        steps.append("")
        steps.append("Step 2: Calculate Mᵢ = M / mᵢ for each modulus")
        M_i = []
        for i, (a, m) in enumerate(pairs):
            M_i_val = M // m
            M_i.append(M_i_val)
            steps.append(f"M_{i+1} = M / m_{i+1} = {M} / {m} = {M_i_val}")
        
        steps.append("")
        steps.append("Step 3: Find multiplicative inverses yᵢ such that Mᵢ × yᵢ ≡ 1 (mod mᵢ)")
        y_i = []
        for i, ((a, m), M_i_val) in enumerate(zip(pairs, M_i)):
            # Find inverse using extended Euclidean algorithm
            steps.append(f"")
            steps.append(f"Finding y_{i+1} such that {M_i_val} × y_{i+1} ≡ 1 (mod {m})")
            
            # Extended Euclidean for this pair
            r0, r1 = M_i_val, m
            t0, t1 = 0, 1
            
            substeps = []
            substeps.append(f"Using Extended Euclidean Algorithm for gcd({M_i_val}, {m})")
            
            iteration = 0
            while r1 != 0:
                q = r0 // r1
                r2 = r0 - q * r1
                t2 = t0 - q * t1
                
                substeps.append(f"q = {q}, r = {r2}, t = {t2}")
                
                r0, r1 = r1, r2
                t0, t1 = t1, t2
                iteration += 1
            
            y = t0 % m
            if y < 0:
                y += m
            
            substeps.append(f"Inverse found: y_{i+1} = {y}")
            substeps.append(f"Verification: {M_i_val} × {y} mod {m} = {(M_i_val * y) % m}")
            
            # Add substeps to main steps
            steps.extend(substeps)
            y_i.append(y)
        
        steps.append("")
        steps.append("Step 4: Calculate solution x = Σ(aᵢ × Mᵢ × yᵢ) mod M")
        x = 0
        calculation_parts = []
        for i, ((a, m), M_i_val, y_val) in enumerate(zip(pairs, M_i, y_i)):
            term = a * M_i_val * y_val
            x += term
            calculation_parts.append(f"{a}×{M_i_val}×{y_val}")
            steps.append(f"Term {i+1}: {a} × {M_i_val} × {y_val} = {term}")
        
        x %= M
        if x < 0:
            x += M
        
        steps.append("")
        steps.append(f"Sum = {' + '.join(calculation_parts)} = {sum(a * M_i_val * y_val for (a, m), M_i_val, y_val in zip(pairs, M_i, y_i))}")
        steps.append(f"x = {sum(a * M_i_val * y_val for (a, m), M_i_val, y_val in zip(pairs, M_i, y_i))} mod {M} = {x}")
        
        steps.append("")
        steps.append("=== VERIFICATION ===")
        for i, (a, m) in enumerate(pairs):
            verification = x % m
            status = "✓" if verification == a % m else "✗"
            steps.append(f"x mod {m} = {verification}, should be {a % m} {status}")
        
        steps.append("")
        steps.append("=== FINAL RESULT ===")
        steps.append(f"Solution: x ≡ {x} (mod {M})")
        steps.append(f"General solution: x = {x} + {M}k, where k is any integer")
        
        return jsonify({
            'solution': x,
            'modulus': M,
            'general_solution': f"{x} + {M}k",
            'steps': steps
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# =================== ENHANCED MATHEMATICAL OPERATIONS WITH DECIMAL SUPPORT ===================
@app.route('/api/math', methods=['POST'])
def math_operations():
    try:
        data = request.json
        operation = data.get('operation')
        num1_str = data.get('num1')
        num2_str = data.get('num2')
        base = data.get('base', 10)
        
        # Handle modulo operation separately (integers only)
        if operation == 'modulo':
            return handle_modulo_operation(num1_str, num2_str, base)
        
        steps = []
        
        def parse_number(s, from_base):
            """Parse number from given base, supporting decimals"""
            if from_base == 10:
                try:
                    return float(s) if '.' in s else int(s)
                except ValueError:
                    raise ValueError(f"Invalid decimal number: {s}")
            
            # For non-decimal bases, split into integer and fractional parts
            if '.' in s:
                integer_part, fractional_part = s.split('.')
            else:
                integer_part, fractional_part = s, ""
            
            steps.append(f"Parsing {s} in base {from_base}:")
            
            # Convert integer part
            if integer_part:
                int_decimal = 0
                power = 0
                for i, char in enumerate(reversed(integer_part.upper())):
                    digit_value = char_to_value(char)
                    if digit_value >= from_base:
                        raise ValueError(f"Digit '{char}' invalid for base {from_base}")
                    contribution = digit_value * (from_base ** power)
                    int_decimal += contribution
                    power += 1
                steps.append(f"  Integer part: {integer_part} = {int_decimal}")
            else:
                int_decimal = 0
            
            # Convert fractional part
            frac_decimal = 0.0
            if fractional_part:
                steps.append(f"  Fractional part: 0.{fractional_part}")
                for i, char in enumerate(fractional_part.upper()):
                    digit_value = char_to_value(char)
                    if digit_value >= from_base:
                        raise ValueError(f"Digit '{char}' invalid for base {from_base}")
                    contribution = digit_value * (from_base ** -(i + 1))
                    frac_decimal += contribution
                steps.append(f"  0.{fractional_part} = {frac_decimal}")
            
            result = int_decimal + frac_decimal
            steps.append(f"Total: {result}")
            return result
        
        def char_to_value(char):
            """Convert character to numeric value"""
            if '0' <= char <= '9':
                return int(char)
            elif 'A' <= char <= 'F':
                return 10 + (ord(char) - ord('A'))
            else:
                raise ValueError(f"Invalid character: {char}")
        
        def decimal_to_base(n, to_base, precision=10):
            """Convert decimal number to given base with specified precision"""
            if to_base == 10:
                return str(n)
            
            steps.append(f"Converting {n} to base {to_base}:")
            
            # Handle negative numbers
            negative = n < 0
            n = abs(n)
            
            # Convert integer part
            integer_part = int(n)
            fractional_part = n - integer_part
            
            # Integer conversion
            int_result = ""
            if integer_part == 0:
                int_result = "0"
                steps.append("  Integer part: 0")
            else:
                temp = integer_part
                while temp > 0:
                    remainder = temp % to_base
                    temp = temp // to_base
                    digit = value_to_char(remainder)
                    int_result = digit + int_result
                    steps.append(f"  {temp * to_base + remainder} ÷ {to_base} = {temp} remainder {remainder} → digit: {digit}")
            
            # Fractional conversion
            frac_result = ""
            if fractional_part > 0:
                steps.append(f"  Fractional part: {fractional_part}")
                temp_frac = fractional_part
                for i in range(precision):
                    if temp_frac == 0:
                        break
                    temp_frac *= to_base
                    digit_value = int(temp_frac)
                    digit = value_to_char(digit_value)
                    frac_result += digit
                    steps.append(f"    {temp_frac / to_base} × {to_base} = {temp_frac} → digit: {digit}")
                    temp_frac -= digit_value
            
            result = ("-" if negative else "") + (int_result or "0")
            if frac_result:
                result += "." + frac_result
                steps.append(f"Final result: {result}")
            else:
                steps.append(f"Final result: {result}")
            
            return result
        
        def value_to_char(value):
            """Convert numeric value to character"""
            if 0 <= value <= 9:
                return str(value)
            elif 10 <= value <= 15:
                return chr(ord('A') + value - 10)
            else:
                raise ValueError(f"Invalid value for conversion: {value}")
        
        # Convert inputs to decimal for calculation
        try:
            steps.append("=== CONVERSION STAGE ===")
            num1_dec = parse_number(num1_str, base)
            steps.append("")
            num2_dec = parse_number(num2_str, base)
            steps.append("")
        except ValueError as e:
            return jsonify({'error': f'Invalid number for base {base}: {str(e)}'}), 400
        
        result_decimal = 0
        
        if operation == 'add':
            steps.append("=== ADDITION STAGE ===")
            steps.append(f"Performing addition: {num1_dec} + {num2_dec}")
            result_decimal = num1_dec + num2_dec
            steps.append(f"Direct decimal result: {num1_dec} + {num2_dec} = {result_decimal}")
            
            # Show step-by-step addition in given base for integers
            if base != 10 and isinstance(num1_dec, int) and isinstance(num2_dec, int):
                steps.append("")
                steps.append("=== STEP-BY-STEP ADDITION IN BASE {} ===".format(base))
                # ... (keep the existing integer addition logic)
        
        elif operation == 'subtract':
            steps.append("=== SUBTRACTION STAGE ===")
            steps.append(f"Performing subtraction: {num1_dec} - {num2_dec}")
            result_decimal = num1_dec - num2_dec
            steps.append(f"Direct decimal result: {num1_dec} - {num2_dec} = {result_decimal}")
            
            # Show step-by-step subtraction in given base for integers
            if base != 10 and isinstance(num1_dec, int) and isinstance(num2_dec, int):
                steps.append("")
                steps.append("=== STEP-BY-STEP SUBTRACTION IN BASE {} ===".format(base))
                # ... (keep the existing integer subtraction logic)
        
        elif operation == 'multiply':
            steps.append("=== MULTIPLICATION STAGE ===")
            steps.append(f"Performing multiplication: {num1_dec} × {num2_dec}")
            result_decimal = num1_dec * num2_dec
            steps.append(f"Direct decimal result: {num1_dec} × {num2_dec} = {result_decimal}")
            
            # Show step-by-step multiplication in given base for integers
            if base != 10 and isinstance(num1_dec, int) and isinstance(num2_dec, int):
                steps.append("")
                steps.append("=== STEP-BY-STEP MULTIPLICATION IN BASE {} ===".format(base))
                # ... (keep the existing integer multiplication logic)
        
        elif operation == 'divide':
            if num2_dec == 0:
                return jsonify({'error': 'Division by zero is not allowed'}), 400
            
            steps.append("=== DIVISION STAGE ===")
            steps.append(f"Performing division: {num1_dec} ÷ {num2_dec}")
            
            if isinstance(num1_dec, int) and isinstance(num2_dec, int):
                # Integer division
                quotient = num1_dec // num2_dec
                remainder = num1_dec % num2_dec
                result_decimal = quotient
                steps.append(f"Integer quotient: {quotient}")
                steps.append(f"Remainder: {remainder}")
                
                # Show step-by-step long division in given base
                if base != 10:
                    steps.append("")
                    steps.append("=== STEP-BY-STEP LONG DIVISION IN BASE {} ===".format(base))
                    # ... (keep the existing integer division logic)
            else:
                # Floating point division
                result_decimal = num1_dec / num2_dec
                steps.append(f"Decimal result: {num1_dec} ÷ {num2_dec} = {result_decimal}")
        
        else:
            return jsonify({'error': 'Invalid operation'}), 400
        
        # Convert result to different bases
        steps.append("")
        steps.append("=== FINAL RESULTS IN DIFFERENT BASES ===")
        
        # Handle conversion based on whether result is integer or float
        if isinstance(result_decimal, int) or result_decimal.is_integer():
            result_decimal = int(result_decimal)
            binary_result = decimal_to_base(result_decimal, 2)
            octal_result = decimal_to_base(result_decimal, 8)
            hexadecimal_result = decimal_to_base(result_decimal, 16)
            decimal_str = str(result_decimal)
        else:
            # For floating point results, we'll show approximate conversions
            binary_result = "~ " + decimal_to_base(result_decimal, 2)
            octal_result = "~ " + decimal_to_base(result_decimal, 8)
            hexadecimal_result = "~ " + decimal_to_base(result_decimal, 16)
            decimal_str = str(result_decimal)
            steps.append("Note: Floating point results shown with 10-digit precision")
        
        steps.append(f"Decimal: {decimal_str}")
        steps.append(f"Binary: {binary_result}")
        steps.append(f"Octal: {octal_result}")
        steps.append(f"Hexadecimal: {hexadecimal_result}")
        
        return jsonify({
            'decimal': decimal_str,
            'binary': binary_result,
            'octal': octal_result,
            'hexadecimal': hexadecimal_result,
            'steps': steps
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

def handle_modulo_operation(num1_str, num2_str, base):
    """Modulo operation - integers only"""
    
    steps = []
    steps.append("=== MODULO OPERATION ===")
    steps.append("Note: Modulo operation requires integer inputs")
    
    # Parse numbers (integers only for modulo)
    try:
        if base == 10:
            dividend = int(float(num1_str))  # Handle decimal input by truncating
            divisor = int(float(num2_str))
            if float(num1_str) != dividend or float(num2_str) != divisor:
                steps.append("Warning: Decimal inputs truncated to integers")
        else:
            # For non-decimal bases, parse as integer
            if '.' in num1_str or '.' in num2_str:
                raise ValueError("Modulo operation requires integer inputs")
            dividend = int(num1_str, base)
            divisor = int(num2_str, base)
        
        steps.append(f"Dividend: {dividend}")
        steps.append(f"Divisor: {divisor}")
        
    except ValueError as e:
        return jsonify({'error': f'Invalid input for modulo operation: {str(e)}'}), 400
    
    if divisor == 0:
        return jsonify({'error': 'Division by zero error in modulo operation'}), 400
    
    # Calculate modulo with detailed steps
    steps.append("")
    steps.append("=== CALCULATION STEPS ===")
    steps.append(f"① Operation: {dividend} mod {divisor}")
    
    quotient = dividend // divisor
    steps.append(f"② Calculate quotient: floor({dividend} ÷ {divisor}) = {quotient}")
    
    product = quotient * divisor
    steps.append(f"③ Multiply quotient by divisor: {quotient} × {divisor} = {product}")
    
    result = dividend - product
    steps.append(f"④ Subtract from dividend: {dividend} - {product} = {result}")
    
    steps.append(f"⑤ Remainder is the modulo result: {result}")
    
    # Convert results to different bases
    steps.append("")
    steps.append("=== FINAL RESULTS IN DIFFERENT BASES ===")
    binary_result = bin(result)[2:]
    octal_result = oct(result)[2:]
    hex_result = hex(result)[2:].upper()
    decimal_result = str(result)
    
    steps.append(f"Decimal: {decimal_result}")
    steps.append(f"Binary: {binary_result}")
    steps.append(f"Octal: {octal_result}")
    steps.append(f"Hexadecimal: {hex_result}")
    
    return jsonify({
        'decimal': decimal_result,
        'binary': binary_result,
        'octal': octal_result,
        'hexadecimal': hex_result,
        'steps': steps,
        'operation': 'modulo'
    })


# =================== CRYPTOGRAPHY ALGORITHMS ===================
import hashlib
import math
import random
from itertools import cycle
import base64

@app.route('/api/crypto', methods=['POST'])
def crypto_operations():
    try:
        data = request.json
        print("Received crypto request:", data)
        
        algorithm = data.get('algorithm', 'caesar')
        operation = data.get('operation', 'encrypt')
        input_text = data.get('input', '')
        key = data.get('key', '')
        
        if not input_text:
            return jsonify({'error': 'Input text is required'}), 400
        
        steps = []
        details = []
        
        if algorithm == 'caesar':
            result = caesar_cipher_crypto(input_text, key, operation, steps, details)
        elif algorithm == 'railfence':
            result = rail_fence_cipher_crypto(input_text, key, operation, steps, details)
        elif algorithm == 'onetimepad':
            result = one_time_pad_crypto(input_text, key, operation, steps, details)
        elif algorithm == 'columnar':
            result = columnar_transposition_crypto(input_text, key, operation, steps, details)
        elif algorithm == 'vernam':
            result = vernam_cipher_crypto(input_text, key, operation, steps, details)
        elif algorithm == 'playfair':
            result = playfair_cipher_crypto(input_text, key, operation, steps, details)
        elif algorithm == 'vigenere':
            result = vigenere_cipher_crypto(input_text, key, operation, steps, details)
        elif algorithm == 'affine':
            result = affine_cipher_crypto(input_text, key, operation, steps, details)
        elif algorithm == 'scytale':
            result = scytale_cipher_crypto(input_text, key, operation, steps, details)
        elif algorithm == 'hill':
            hill_size = int(data.get('hillSize', 2))
            result = hill_cipher_crypto(input_text, key, hill_size, operation, steps, details)
        elif algorithm == 'substitution':
            result = substitution_cipher_crypto(input_text, key, operation, steps, details)
        elif algorithm == 'transposition':
            result = transposition_cipher_crypto(input_text, key, operation, steps, details)
        elif algorithm == 'sha256':
            result = sha256_hash_crypto(input_text, steps, details)
        elif algorithm == 'monoalphabetic':
            result = monoalphabetic_cipher_crypto(input_text, key, operation, steps, details)
        elif algorithm == 'polyalphabetic':
            result = polyalphabetic_cipher_crypto(input_text, key, operation, steps, details)
        elif algorithm == 'product':
            result = product_cipher_crypto(input_text, key, operation, steps, details)
        elif algorithm == 'rsa':
            rsa_mode = data.get('rsaMode', 'encrypt')
            if rsa_mode == 'keygen':
                result = rsa_crypto(input_text, key, 'keygen', steps, details)
            elif rsa_mode == 'decrypt':
                result = rsa_crypto(input_text, key, 'decrypt', steps, details)
            else:
                result = rsa_crypto(input_text, key, 'encrypt', steps, details)
        elif algorithm == 'diffiehellman':
            result = diffie_hellman_crypto(input_text, key, operation, steps, details)
        else:
            return jsonify({'error': f'Unknown algorithm: {algorithm}'}), 400
        
        return jsonify({
            'result': result,
            'steps': steps,
            'details': details
        })
        
    except Exception as e:
        print(f"Crypto error: {str(e)}")
        return jsonify({'error': str(e)}), 400

# Caesar Cipher
def caesar_cipher_crypto(text, key, operation, steps, details):
    try:
        shift = int(key) if key else 3
    except:
        shift = 3
    
    steps.append(f"=== CAESAR CIPHER {operation.upper()} ===")
    steps.append(f"Input text: '{text}'")
    steps.append(f"Shift value: {shift}")
    steps.append("")
    
    result = ""
    for i, char in enumerate(text):
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            char_pos = ord(char) - base
            
            if operation == 'encrypt':
                new_pos = (char_pos + shift) % 26
                steps.append(f"Character {i+1}: '{char}' (position {char_pos}) → +{shift} → position {new_pos} → '{chr(base + new_pos)}'")
            else:
                new_pos = (char_pos - shift) % 26
                steps.append(f"Character {i+1}: '{char}' (position {char_pos}) → -{shift} → position {new_pos} → '{chr(base + new_pos)}'")
            
            result += chr(base + new_pos)
        else:
            result += char
            steps.append(f"Character {i+1}: '{char}' → '{char}' (non-alphabetic, unchanged)")
    
    details.append(f"Operation: {operation.capitalize()} with shift {shift}")
    details.append(f"Alphabet shift: {shift} positions {'right' if operation == 'encrypt' else 'left'}")
    details.append(f"Total characters processed: {len(text)}")
    
    return result

# Playfair Cipher
def playfair_cipher_crypto(text, key, operation, steps, details):
    steps.append(f"=== PLAYFAIR CIPHER {operation.upper()} ===")
    steps.append(f"Input text: '{text}'")
    steps.append(f"Key: '{key}'")
    steps.append("")
    
    key = key.upper().replace(' ', '').replace('J', 'I') if key else "KEY"
    text = text.upper().replace(' ', '').replace('J', 'I')
    
    steps.append(f"Prepared key: '{key}'")
    steps.append(f"Prepared text: '{text}'")
    
    alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ"
    key_square = ""
    
    for char in key:
        if char not in key_square and char in alphabet:
            key_square += char
    
    for char in alphabet:
        if char not in key_square:
            key_square += char

    steps.append("Key Square (5x5 grid):")
    for i in range(0, 25, 5):
        steps.append(f"  {key_square[i:i+5]}")
    
    if len(text) % 2 != 0:
        text += 'X'
        steps.append(f"Added 'X' to make even length: '{text}'")
    
    digraphs = [text[i:i+2] for i in range(0, len(text), 2)]
    steps.append(f"Digraphs: {digraphs}")
    steps.append("")
    
    result = ""
    for digraph in digraphs:
        a, b = digraph[0], digraph[1]
        
        if a == b:
            b = 'X'
            steps.append(f"Digraph '{digraph}' → '{a}{b}' (replaced second with X)")
        
        pos_a = key_square.index(a)
        pos_b = key_square.index(b)
        row_a, col_a = pos_a // 5, pos_a % 5
        row_b, col_b = pos_b // 5, pos_b % 5
        
        steps.append(f"Processing digraph '{a}{b}':")
        steps.append(f"  '{a}' at position ({row_a}, {col_a})")
        steps.append(f"  '{b}' at position ({row_b}, {col_b})")
        
        if row_a == row_b:
            if operation == 'encrypt':
                new_col_a = (col_a + 1) % 5
                new_col_b = (col_b + 1) % 5
                steps.append(f"  Same row → shift right: {col_a}→{new_col_a}, {col_b}→{new_col_b}")
            else:
                new_col_a = (col_a - 1) % 5
                new_col_b = (col_b - 1) % 5
                steps.append(f"  Same row → shift left: {col_a}→{new_col_a}, {col_b}→{new_col_b}")
            
            new_a = key_square[row_a * 5 + new_col_a]
            new_b = key_square[row_b * 5 + new_col_b]
            
        elif col_a == col_b:
            if operation == 'encrypt':
                new_row_a = (row_a + 1) % 5
                new_row_b = (row_b + 1) % 5
                steps.append(f"  Same column → shift down: {row_a}→{new_row_a}, {row_b}→{new_row_b}")
            else:
                new_row_a = (row_a - 1) % 5
                new_row_b = (row_b - 1) % 5
                steps.append(f"  Same column → shift up: {row_a}→{new_row_a}, {row_b}→{new_row_b}")
            
            new_a = key_square[new_row_a * 5 + col_a]
            new_b = key_square[new_row_b * 5 + col_b]
            
        else:
            new_a = key_square[row_a * 5 + col_b]
            new_b = key_square[row_b * 5 + col_a]
            steps.append(f"  Rectangle → swap columns: ({row_a},{col_a})&({row_b},{col_b}) → ({row_a},{col_b})&({row_b},{col_a})")
        
        result += new_a + new_b
        steps.append(f"  Result: '{a}{b}' → '{new_a}{new_b}'")
        steps.append("")
    
    details.append(f"Key used: '{key}'")
    details.append(f"Number of digraphs processed: {len(digraphs)}")
    details.append("Note: J is replaced with I in Playfair cipher")
    
    return result

# Vigenère Cipher
def vigenere_cipher_crypto(text, key, operation, steps, details):
    steps.append(f"=== VIGENÈRE CIPHER {operation.upper()} ===")
    steps.append(f"Input text: '{text}'")
    steps.append(f"Key: '{key}'")
    steps.append("")
    
    key = key.upper() if key else "KEY"
    result = ""
    key_index = 0
    
    steps.append("Processing each character:")
    for i, char in enumerate(text):
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            key_char = key[key_index % len(key)]
            key_shift = ord(key_char) - ord('A')
            
            char_pos = ord(char) - base
            
            if operation == 'encrypt':
                new_pos = (char_pos + key_shift) % 26
                steps.append(f"  '{char}' + '{key_char}'(shift {key_shift}) → position {(char_pos + key_shift) % 26} → '{chr(base + new_pos)}'")
            else:
                new_pos = (char_pos - key_shift) % 26
                steps.append(f"  '{char}' - '{key_char}'(shift {key_shift}) → position {(char_pos - key_shift) % 26} → '{chr(base + new_pos)}'")
            
            result += chr(base + new_pos)
            key_index += 1
        else:
            result += char
            steps.append(f"  '{char}' → '{char}' (non-alphabetic, unchanged)")
    
    details.append(f"Key: '{key}'")
    details.append(f"Key shifts: {[ord(k)-ord('A') for k in key]}")
    details.append(f"Key length: {len(key)}")
    details.append(f"Total characters processed: {len(text)}")
    
    return result

# Affine Cipher
def affine_cipher_crypto(text, key, operation, steps, details):
    steps.append(f"=== AFFINE CIPHER {operation.upper()} ===")
    steps.append(f"Input text: '{text}'")
    steps.append(f"Key: '{key}'")
    steps.append("")
    
    try:
        if ',' in key:
            a, b = map(int, key.split(','))
        else:
            a, b = 5, 8
    except:
        a, b = 5, 8
    
    steps.append(f"Using keys: a={a}, b={b}")
    
    def mod_inverse(a, m):
        for i in range(1, m):
            if (a * i) % m == 1:
                return i
        return None
    
    a_inv = mod_inverse(a, 26)
    if a_inv is None:
        raise ValueError(f"Key a={a} has no modular inverse modulo 26")
    
    steps.append(f"Modular inverse of {a} mod 26: {a_inv}")
    steps.append("")
    
    result = ""
    for i, char in enumerate(text):
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            x = ord(char) - base
            
            if operation == 'encrypt':
                y = (a * x + b) % 26
                steps.append(f"  E('{char}') = ({a}×{x} + {b}) mod 26 = {y} → '{chr(base + y)}'")
            else:
                y = (a_inv * (x - b)) % 26
                steps.append(f"  D('{char}') = {a_inv}×({x} - {b}) mod 26 = {y} → '{chr(base + y)}'")
            
            result += chr(base + y)
        else:
            result += char
            steps.append(f"  '{char}' → '{char}' (non-alphabetic, unchanged)")
    
    details.append(f"Encryption formula: E(x) = ({a}×x + {b}) mod 26")
    details.append(f"Decryption formula: D(y) = {a_inv}×(y - {b}) mod 26")
    details.append(f"Modular arithmetic: All operations performed mod 26")
    
    return result

# Rail Fence Cipher
def rail_fence_cipher_crypto(text, key, operation, steps, details):
    steps.append(f"=== RAIL FENCE CIPHER {operation.upper()} ===")
    steps.append(f"Input text: '{text}'")
    
    try:
        rails = int(key) if key else 3
    except:
        rails = 3
    
    steps.append(f"Number of rails: {rails}")
    steps.append("")
    
    if operation == 'encrypt':
        fence = [[] for _ in range(rails)]
        rail = 0
        direction = 1
        
        steps.append("Writing text in zigzag pattern:")
        for i, char in enumerate(text):
            fence[rail].append(char)
            steps.append(f"  Position {i}: '{char}' placed on rail {rail}")
            
            rail += direction
            if rail == 0 or rail == rails - 1:
                direction = -direction
                steps.append(f"    Changing direction at rail {rail}")
        
        steps.append("")
        steps.append("Rail arrangement:")
        for r in range(rails):
            rail_content = ''.join(fence[r]) if fence[r] else '(empty)'
            steps.append(f"  Rail {r}: {rail_content}")
        
        result = ''.join(''.join(rail) for rail in fence)
        steps.append(f"Final result reading rails in order: '{result}'")
        
    else:
        pattern = []
        rail = 0
        direction = 1
        for _ in range(len(text)):
            pattern.append(rail)
            rail += direction
            if rail == 0 or rail == rails - 1:
                direction = -direction
        
        rail_counts = [pattern.count(r) for r in range(rails)]
        steps.append(f"Characters per rail: {rail_counts}")
        
        rails_text = []
        start = 0
        for count in rail_counts:
            rails_text.append(text[start:start+count])
            start += count
        
        steps.append("Text split into rails:")
        for r in range(rails):
            steps.append(f"  Rail {r}: '{rails_text[r]}'")
        
        result = ""
        rail_positions = [0] * rails
        for target_rail in pattern:
            result += rails_text[target_rail][rail_positions[target_rail]]
            rail_positions[target_rail] += 1
            steps.append(f"  Reading from rail {target_rail}: '{result[-1]}' → '{result}'")
    
    details.append(f"Number of rails: {rails}")
    details.append(f"Text length: {len(text)}")
    details.append("Pattern: Write in zigzag, read horizontally")
    
    return result

# Columnar Transposition
def columnar_transposition_crypto(text, key, operation, steps, details):
    steps.append(f"=== COLUMNAR TRANSPOSITION {operation.upper()} ===")
    steps.append(f"Input text: '{text}'")
    steps.append(f"Key: '{key}'")
    steps.append("")
    
    key = key.upper() if key else "KEY"
    text = text.replace(' ', '')
    steps.append(f"Text without spaces: '{text}'")
    
    sorted_key = sorted(key)
    key_order = [sorted_key.index(c) for c in key]
    
    steps.append(f"Key: {list(key)}")
    steps.append(f"Sorted key: {sorted_key}")
    steps.append(f"Column order: {key_order}")
    steps.append("")
    
    cols = len(key)
    rows = math.ceil(len(text) / cols)
    
    steps.append(f"Grid size: {rows} rows × {cols} columns")
    
    if operation == 'encrypt':
        if len(text) < rows * cols:
            text += 'X' * (rows * cols - len(text))
            steps.append(f"Padded text: '{text}'")
        
        grid = [list(text[i*cols:(i+1)*cols]) for i in range(rows)]
        
        steps.append("Writing text row by row:")
        for r, row in enumerate(grid):
            steps.append(f"  Row {r}: {row}")
        
        steps.append("")
        steps.append("Reading columns in key order:")
        result = ""
        for order in sorted(range(cols), key=lambda x: key_order[x]):
            column = ''.join(grid[row][order] for row in range(rows))
            result += column
            steps.append(f"  Column {order+1} (key '{key[order]}'): '{column}'")
        
        steps.append(f"Final result: '{result}'")
        
    else:
        steps.append("Decryption process:")
        
        full_cols = len(text) % cols
        col_lengths = [rows if i < full_cols else rows-1 for i in range(cols)]
        
        steps.append(f"Column lengths: {col_lengths}")
        
        columns = [''] * cols
        start = 0
        for i in sorted(range(cols), key=lambda x: key_order[x]):
            length = col_lengths[i]
            columns[i] = text[start:start+length]
            start += length
            steps.append(f"  Column {i+1} (key '{key[i]}'): '{columns[i]}' (length {length})")
        
        result = ""
        for row in range(rows):
            row_text = ""
            for col in range(cols):
                if row < len(columns[col]):
                    row_text += columns[col][row]
                    result += columns[col][row]
            steps.append(f"  Row {row}: {list(row_text)} → '{result}'")
    
    details.append(f"Key: '{key}'")
    details.append(f"Grid: {rows}×{cols}")
    details.append(f"Column order: {key_order}")
    
    return result

# Substitution Cipher
def substitution_cipher_crypto(text, key, operation, steps, details):
    steps.append(f"=== SUBSTITUTION CIPHER {operation.upper()} ===")
    steps.append(f"Input text: '{text}'")
    
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    
    if not key or len(key) != 26:
        key = "ZYXWVUTSRQPONMLKJIHGFEDCBA"
        steps.append("Using default reverse alphabet substitution")
    else:
        key = key.upper()
        steps.append(f"Using custom substitution key")
    
    steps.append(f"Alphabet:    {alphabet}")
    steps.append(f"Substitution: {key}")
    steps.append("")
    
    if operation == 'encrypt':
        substitution = {alphabet[i]: key[i] for i in range(26)}
        steps.append("Encryption mapping:")
    else:
        substitution = {key[i]: alphabet[i] for i in range(26)}
        steps.append("Decryption mapping:")
    
    for i in range(min(8, 26)):
        if operation == 'encrypt':
            steps.append(f"  {alphabet[i]} → {key[i]}")
        else:
            steps.append(f"  {key[i]} → {alphabet[i]}")
    if 26 > 8:
        steps.append("  ...")
    
    steps.append("")
    steps.append("Processing text:")
    
    result = ""
    for char in text.upper():
        if char in substitution:
            result += substitution[char]
            steps.append(f"  '{char}' → '{substitution[char]}'")
        else:
            result += char
            steps.append(f"  '{char}' → '{char}' (not in alphabet)")
    
    details.append(f"Substitution alphabet: {key}")
    details.append("Each letter is replaced according to the mapping")
    
    return result

# Transposition Cipher
def transposition_cipher_crypto(text, key, operation, steps, details):
    return columnar_transposition_crypto(text, key, operation, steps, details)

# SHA-256 Hash
def sha256_hash_crypto(text, steps, details):
    steps.append("=== SHA-256 HASH ===")
    steps.append(f"Input text: '{text}'")
    steps.append("")
    
    text_bytes = text.encode('utf-8')
    steps.append(f"Text as bytes: {list(text_bytes)}")
    steps.append(f"Byte length: {len(text_bytes)} bytes")
    steps.append("")
    
    hash_obj = hashlib.sha256(text_bytes)
    hash_hex = hash_obj.hexdigest()
    
    steps.append("SHA-256 computation steps:")
    steps.append("1. Pre-processing: Pad message to multiple of 512 bits")
    steps.append("2. Initialize hash values with constants")
    steps.append("3. Process message in 512-bit chunks")
    steps.append("4. Apply compression function to each chunk")
    steps.append("5. Final hash value is concatenation of hash values")
    steps.append("")
    steps.append(f"Final SHA-256 hash: {hash_hex}")
    
    details.append(f"Hash length: 256 bits (64 hex characters)")
    details.append(f"Input size: {len(text_bytes)} bytes")
    details.append("SHA-256 is a cryptographic hash function")
    details.append("Used in Bitcoin, TLS/SSL, and many security applications")
    
    return hash_hex

# Scytale Cipher
def scytale_cipher_crypto(text, key, operation, steps, details):
    steps.append(f"=== SCYTALE CIPHER {operation.upper()} ===")
    steps.append(f"Input text: '{text}'")
    
    try:
        diameter = int(key) if key else 3
    except:
        diameter = 3
    
    steps.append(f"Cylinder diameter: {diameter}")
    steps.append("")
    
    if operation == 'encrypt':
        steps.append("Wrapping text around cylinder and reading horizontally:")
        result = ""
        for i in range(diameter):
            column = text[i::diameter]
            result += column
            steps.append(f"  Column {i+1}: '{column}'")
        steps.append(f"Final result: '{result}'")
        
    else:
        steps.append("Reading horizontal stripes and unwrapping from cylinder:")
        rows = math.ceil(len(text) / diameter)
        result = ""
        for i in range(rows):
            row_chars = text[i::rows]
            result += row_chars
            steps.append(f"  Row {i+1}: '{row_chars}' → '{result}'")
    
    details.append(f"Diameter: {diameter}")
    details.append(f"Text length: {len(text)}")
    details.append("Ancient Spartan cipher using a cylinder/wrap method")
    
    return result

# Hill Cipher
def hill_cipher_crypto(text, key, size, operation, steps, details):
    try:
        size = int(size)
        key_matrix = list(map(int, key.split(',')))
        if len(key_matrix) != size * size:
            raise ValueError("Key matrix size doesn't match specified size")
    except:
        size = 2
        key_matrix = [3, 2, 1, 4]
    
    steps.append(f"=== HILL CIPHER {operation.upper()} ===")
    steps.append(f"Input text: '{text}'")
    steps.append(f"Key matrix: {key_matrix}")
    steps.append(f"Matrix size: {size}x{size}")
    
    text = text.upper().replace(' ', '')
    if len(text) % size != 0:
        text += 'X' * (size - len(text) % size)
    
    text_numbers = [ord(c) - ord('A') for c in text]
    key_matrix = [key_matrix[i*size:(i+1)*size] for i in range(size)]
    steps.append(f"Key matrix: {key_matrix}")
    
    result_numbers = []
    for i in range(0, len(text_numbers), size):
        block = text_numbers[i:i+size]
        steps.append(f"Processing block: {block}")
        
        if operation == 'encrypt':
            encrypted_block = []
            for row in key_matrix:
                total = sum(row[j] * block[j] for j in range(size)) % 26
                encrypted_block.append(total)
            result_numbers.extend(encrypted_block)
            steps.append(f"Encrypted block: {encrypted_block}")
        else:
            if size == 2:
                det = key_matrix[0][0] * key_matrix[1][1] - key_matrix[0][1] * key_matrix[1][0]
                det_inv = pow(det, -1, 26)
                
                inv_matrix = [
                    [key_matrix[1][1], -key_matrix[0][1]],
                    [-key_matrix[1][0], key_matrix[0][0]]
                ]
                inv_matrix = [[(det_inv * x) % 26 for x in row] for row in inv_matrix]
                
                decrypted_block = []
                for row in inv_matrix:
                    total = sum(row[j] * block[j] for j in range(size)) % 26
                    decrypted_block.append(total)
                result_numbers.extend(decrypted_block)
                steps.append(f"Decrypted block: {decrypted_block}")
            else:
                result_numbers.extend(block)
                steps.append("3x3 decryption not implemented in this demo")
    
    result = ''.join(chr(num + ord('A')) for num in result_numbers)
    details.append(f"Matrix operations performed: {len(text_numbers)//size}")
    return result

# Monoalphabetic Cipher
def monoalphabetic_cipher_crypto(text, key, operation, steps, details):
    return substitution_cipher_crypto(text, key, operation, steps, details)

# Polyalphabetic Cipher
def polyalphabetic_cipher_crypto(text, key, operation, steps, details):
    return vigenere_cipher_crypto(text, key, operation, steps, details)

# Product Cipher
def product_cipher_crypto(text, key, operation, steps, details):
    steps.append("=== PRODUCT CIPHER ===")
    steps.append("Applying substitution then transposition")
    
    sub_result = substitution_cipher_crypto(text, key, operation, [], [])
    steps.append(f"After substitution: {sub_result}")
    
    result = columnar_transposition_crypto(sub_result, key, operation, [], [])
    steps.append(f"After transposition: {result}")
    
    return result

# Substitution-Permutation Network
def spn_cipher_crypto(text, key, operation, steps, details):
    steps.append("=== SUBSTITUTION-PERMUTATION NETWORK ===")
    steps.append("Multiple rounds of substitution and permutation")
    
    result = text
    rounds = 4
    
    for round_num in range(rounds):
        sub_key = key + str(round_num)
        result = substitution_cipher_crypto(result, sub_key, operation, [], [])
        steps.append(f"Round {round_num+1} substitution: {result}")
        
        if len(result) > 1:
            result = result[1:] + result[0]
            steps.append(f"Round {round_num+1} permutation: {result}")
    
    return result

# One-Time Pad
def one_time_pad_crypto(text, key, operation, steps, details):
    steps.append(f"=== ONE-TIME PAD {operation.upper()} ===")
    steps.append(f"Input text: '{text}'")
    steps.append(f"Key: '{key}'")
    steps.append("")
    
    if len(key) != len(text):
        steps.append(f"ERROR: Key length ({len(key)}) must equal text length ({len(text)})")
        return "Error: Key length must equal text length"
    
    steps.append("Processing XOR operation character by character:")
    result = ""
    
    for i in range(len(text)):
        if operation == 'encrypt':
            xor_result = ord(text[i]) ^ ord(key[i])
            result += chr(xor_result)
            steps.append(f"  '{text[i]}' ({ord(text[i]):08b}) XOR '{key[i]}' ({ord(key[i]):08b}) = {xor_result:08b} → '{chr(xor_result)}'")
        else:
            xor_result = ord(text[i]) ^ ord(key[i])
            result += chr(xor_result)
            steps.append(f"  '{text[i]}' ({ord(text[i]):08b}) XOR '{key[i]}' ({ord(key[i]):08b}) = {xor_result:08b} → '{chr(xor_result)}'")
    
    details.append("One-Time Pad provides perfect secrecy when key is truly random and never reused")
    details.append("Key must be at least as long as the message")
    details.append("Operation: XOR between text and key characters")
    
    return result

# Vernam Cipher (similar to One-Time Pad)
def vernam_cipher_crypto(text, key, operation, steps, details):
    steps.append(f"=== VERNAM CIPHER {operation.upper()} ===")
    steps.append(f"Input text: '{text}'")
    steps.append(f"Key: '{key}'")
    steps.append("")
    
    # If key is binary, convert to characters
    if all(c in '01' for c in key.replace(' ', '')):
        binary_key = key.replace(' ', '')
        if len(binary_key) != len(text) * 8:
            steps.append(f"ERROR: Binary key length must be {len(text) * 8} bits")
            return "Error: Invalid key length"
        
        # Convert binary key to characters
        key_chars = ''
        for i in range(0, len(binary_key), 8):
            byte = binary_key[i:i+8]
            key_chars += chr(int(byte, 2))
        key = key_chars
        steps.append(f"Converted binary key to characters: '{key}'")
    
    if len(key) != len(text):
        steps.append(f"ERROR: Key length ({len(key)}) must equal text length ({len(text)})")
        return "Error: Key length must equal text length"
    
    steps.append("Processing XOR operation:")
    result = ""
    
    for i in range(len(text)):
        xor_result = ord(text[i]) ^ ord(key[i])
        result_char = chr(xor_result)
        result += result_char
        steps.append(f"  '{text[i]}' ({ord(text[i]):08b}) XOR '{key[i]}' ({ord(key[i]):08b}) = {xor_result:08b} → '{result_char}'")
    
    details.append("Vernam Cipher is an implementation of One-Time Pad")
    details.append("Invented by Gilbert Vernam in 1917")
    details.append("Provides perfect secrecy with truly random keys")
    
    return result

# RSA Algorithm
def rsa_crypto(text, key, operation, steps, details):
    steps.append(f"=== RSA ALGORITHM {operation.upper()} ===")
    
    try:
        if ',' in key:
            params = list(map(int, key.split(',')))
        else:
            params = [61, 53, 17]  # Default: p=61, q=53, e=17
        
        if operation == 'keygen':
            if len(params) >= 2:
                p, q = params[0], params[1]
            else:
                p, q = 61, 53
            
            n = p * q
            phi = (p - 1) * (q - 1)
            
            # Find e (public exponent)
            e = 65537
            for candidate in [3, 5, 17, 257, 65537]:
                if candidate < phi and math.gcd(candidate, phi) == 1:
                    e = candidate
                    break
            
            # Find d (private exponent)
            d = pow(e, -1, phi)
            
            steps.append(f"Key Generation Parameters:")
            steps.append(f"  p = {p} (prime)")
            steps.append(f"  q = {q} (prime)")
            steps.append(f"  n = p × q = {p} × {q} = {n}")
            steps.append(f"  φ(n) = (p-1)(q-1) = {p-1} × {q-1} = {phi}")
            steps.append(f"  Public exponent e = {e} (coprime to φ(n))")
            steps.append(f"  Private exponent d = e⁻¹ mod φ(n) = {d}")
            
            details.append(f"Public Key: (n={n}, e={e})")
            details.append(f"Private Key: (n={n}, d={d})")
            details.append(f"Key size: {n.bit_length()} bits")
            
            return f"Public: ({n},{e}), Private: ({n},{d})"
        
        elif operation == 'encrypt':
            if len(params) >= 3:
                p, q, e = params[0], params[1], params[2]
                n = p * q
            elif len(params) >= 2:
                n, e = params[0], params[1]
            else:
                return "Error: Need n and e for encryption"
            
            steps.append(f"Encryption Parameters:")
            steps.append(f"  n = {n}")
            steps.append(f"  e = {e}")
            steps.append("")
            
            encrypted = []
            for char in text:
                m = ord(char)
                c = pow(m, e, n)
                encrypted.append(c)
                steps.append(f"  '{char}' (ASCII {m}) → {m}^{e} mod {n} = {c}")
            
            result = ' '.join(map(str, encrypted))
            details.append(f"RSA encryption: C = M^e mod n")
            details.append(f"Each character encrypted separately")
            
            return result
        
        elif operation == 'decrypt':
            if len(params) >= 3:
                p, q, d = params[0], params[1], params[2]
                n = p * q
            elif len(params) >= 2:
                n, d = params[0], params[1]
            else:
                return "Error: Need n and d for decryption"
            
            steps.append(f"Decryption Parameters:")
            steps.append(f"  n = {n}")
            steps.append(f"  d = {d}")
            steps.append("")
            
            encrypted_numbers = list(map(int, text.split()))
            decrypted = ""
            
            for c in encrypted_numbers:
                m = pow(c, d, n)
                decrypted += chr(m)
                steps.append(f"  {c} → {c}^{d} mod {n} = {m} → '{chr(m)}'")
            
            details.append(f"RSA decryption: M = C^d mod n")
            
            return decrypted
    
    except Exception as e:
        return f"RSA Error: {str(e)}"

# Diffie-Hellman Key Exchange
def diffie_hellman_crypto(text, key, operation, steps, details):
    steps.append(f"=== DIFFIE-HELLMAN KEY EXCHANGE ===")
    
    try:
        if ',' in key:
            params = list(map(int, key.split(',')))
            if len(params) >= 4:
                p, g, a, b = params[0], params[1], params[2], params[3]
            else:
                p, g, a, b = 23, 5, 6, 15
        else:
            p, g, a, b = 23, 5, 6, 15
        
        steps.append("Parameters:")
        steps.append(f"  Prime modulus (p) = {p}")
        steps.append(f"  Base/generator (g) = {g}")
        steps.append(f"  Alice's private key (a) = {a}")
        steps.append(f"  Bob's private key (b) = {b}")
        steps.append("")
        
        # Alice computes A = g^a mod p
        A = pow(g, a, p)
        steps.append(f"1. Alice computes A = g^a mod p = {g}^{a} mod {p} = {A}")
        steps.append(f"   Alice sends A = {A} to Bob")
        
        # Bob computes B = g^b mod p
        B = pow(g, b, p)
        steps.append(f"2. Bob computes B = g^b mod p = {g}^{b} mod {p} = {B}")
        steps.append(f"   Bob sends B = {B} to Alice")
        steps.append("")
        
        # Alice computes shared secret s = B^a mod p
        s_alice = pow(B, a, p)
        steps.append(f"3. Alice computes s = B^a mod p = {B}^{a} mod {p} = {s_alice}")
        
        # Bob computes shared secret s = A^b mod p
        s_bob = pow(A, b, p)
        steps.append(f"4. Bob computes s = A^b mod p = {A}^{b} mod {p} = {s_bob}")
        steps.append("")
        
        if s_alice == s_bob:
            steps.append(f"✓ SUCCESS: Both computed same shared secret = {s_alice}")
            result = f"Shared Secret: {s_alice}"
        else:
            steps.append(f"✗ ERROR: Shared secrets don't match! {s_alice} ≠ {s_bob}")
            result = "Error: Shared secrets don't match"
        
        details.append(f"Shared secret: s = g^(ab) mod p = {g}^({a}×{b}) mod {p}")
        details.append("Security relies on difficulty of discrete logarithm problem")
        details.append(f"Public values exchanged: A={A}, B={B}")
        details.append(f"Private values kept secret: a={a}, b={b}")
        
        return result
    
    except Exception as e:
        return f"Diffie-Hellman Error: {str(e)}"

if __name__ == '__main__':
    app.run(debug=True, port=8000, host='0.0.0.0')