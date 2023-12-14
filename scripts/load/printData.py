
import pip

def import_or_install(package):
    try:
        __import__(package)
    except ImportError:
        pip.main(['install', package])   


import_or_install('matplotlib')
import_or_install('pandas')
import_or_install('numpy')
import_or_install('glob')
import_or_install('os')

import pandas as pd
import os
import matplotlib.pyplot as plt
import numpy as np
import glob as glob


if not os.path.exists('./results/images'):
    os.makedirs('./results/images')


filenames = glob.glob('./results/data/*.csv')

filenum = len(filenames)

if filenum == 0:
    print("No csv files found in ./results/data")
    exit(1)


for index, name in enumerate(filenames):
    csv = pd.read_csv(name, delimiter=',')
    y = csv['requests_per_second']
    x = csv['timestamp']
    plt.bar(x,y, align='center', alpha=0.5)
    currentName = name.split('/')[-1].replace('.csv','')
    plt.title(currentName)
    plt.xlabel('timestamp')
    plt.ylabel('requests per second')
    plt.savefig('./results/images/' + currentName + '.png')
    plt.close()







